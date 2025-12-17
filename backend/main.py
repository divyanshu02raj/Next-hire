import os
import json
import re
from collections import Counter
import joblib
import scipy.sparse as sp
import numpy as np
import requests
from typing import Optional, List, Dict, Any, Tuple
from contextlib import asynccontextmanager

import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Import your Pydantic models
from app.models import (
    ResumeInput, ResumeOutput, ATSAnalysisInput, ATSAnalysisOutput,
    RewriteSuggestion, CategorizedSkills, Certification, Language,
    JobSearchInput, JobSearchResponse, JobPosting, JobSearchFilters,
    JobApplyInput, JobApplyResponse, JobApplyAllInput
)

# --- GLOBAL VARIABLES for Model Artifacts ---
# These will be loaded into memory on startup
model_artifacts: Dict[str, Any] = {}

# --- FastAPI Lifespan Manager for Model Loading ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # This code runs ONCE when the API server starts up.
    print("Server startup: Loading ML model artifacts...")
    try:
        model_artifacts["ats_model"] = joblib.load('ats_model.joblib')
        model_artifacts["tfidf_resume"] = joblib.load('tfidf_resume.joblib')
        model_artifacts["tfidf_jd"] = joblib.load('tfidf_jd.joblib')
        print("Successfully loaded all model artifacts.")
    except FileNotFoundError as e:
        print(f"CRITICAL ERROR: Could not find model artifact: {e}")
        print("Ensure 'ats_model.joblib', 'tfidf_resume.joblib', and 'tfidf_jd.joblib' are in the 'backend/' directory.")
    
    yield # The server is now running

    # This code runs ONCE when the server shuts down.
    print("Server shutdown: Clearing model artifacts.")
    model_artifacts.clear()


# --- Load environment variables from .env file ---
load_dotenv()

# --- Gemini API Configuration ---
try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
    llm = genai.GenerativeModel('gemini-flash-latest') # Renamed to 'llm' for clarity
except KeyError:
    raise RuntimeError("GOOGLE_API_KEY not found. Please ensure it's in a .env file.")

# --- Adzuna Configuration ---
ADZUNA_APP_ID = os.environ.get("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.environ.get("ADZUNA_APP_KEY")
ADZUNA_COUNTRY = os.environ.get("ADZUNA_COUNTRY", "in")
ADZUNA_ENDPOINT_TEMPLATE = "https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"

RESUME_STOPWORDS = {
    "and", "the", "for", "with", "that", "this", "from", "your", "have", "has",
    "experience", "skills", "years", "work", "team", "you", "are", "our", "job",
    "role", "project", "projects", "company", "ability", "knowledge", "responsible"
}

ROLE_KEYWORDS = [
    "software engineer",
    "frontend developer",
    "backend developer",
    "full stack developer",
    "data scientist",
    "machine learning engineer",
    "product manager",
    "project manager",
    "business analyst",
    "marketing manager",
    "ui ux designer",
    "devops engineer",
    "mobile developer",
    "cloud architect",
    "cyber security engineer",
]


# --- FastAPI App Initialization with Lifespan ---
app = FastAPI(
    title="Next Hire API",
    description="API for the AI-powered job search platform.",
    version="0.3.0", # Version bump for custom model integration
    lifespan=lifespan
)

# --- CORS Configuration ---
origins_str = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in origins_str.split(',')]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# --- Helper Functions ---
def extract_json_from_response(response_text: str) -> dict:
    """Finds and parses a JSON object from a string, ignoring markdown."""
    match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
    if match:
        json_str = match.group(1)
    else:
        start_index = response_text.find('{')
        end_index = response_text.rfind('}') + 1
        if start_index != -1 and end_index != 0:
            json_str = response_text[start_index:end_index]
        else:
            raise ValueError("No valid JSON object found in the AI response.")
    return json.loads(json_str)

def clean_text(text: str) -> str:
    """A simple function to clean text, must be IDENTICAL to the one in your ML scripts."""
    if not isinstance(text, str):
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    text = text.lower()
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# --- CUSTOM MODEL PREDICTION FUNCTION ---
def predict_score_with_custom_model(resume_text: str, jd_text: str) -> int:
    """Uses the loaded custom XGBoost model to predict a score."""
    if not all(k in model_artifacts for k in ["ats_model", "tfidf_resume", "tfidf_jd"]):
        raise HTTPException(status_code=503, detail="Model artifacts are not loaded. Server is not ready.")

    cleaned_resume = clean_text(resume_text)
    cleaned_jd = clean_text(jd_text)
    resume_vector = model_artifacts["tfidf_resume"].transform([cleaned_resume])
    jd_vector = model_artifacts["tfidf_jd"].transform([cleaned_jd])
    
    # Placeholder for re-calculating custom features on the fly
    keyword_score = 50 
    experience_gap = 0 
    custom_features = np.array([[keyword_score, experience_gap]])
    
    X_pred = sp.hstack((resume_vector, jd_vector, custom_features), format='csr')
    predicted_score = model_artifacts["ats_model"].predict(X_pred)[0]
    return int(max(0, min(100, round(predicted_score))))


# --- AI Parsing Functions ---

def parse_resume_with_ai(resume_text: str) -> dict:
    json_schema = ResumeOutput.model_json_schema()
    prompt = f"""
    You are an expert, highly meticulous resume parser...
    JSON Schema: {json.dumps(json_schema, indent=2)}
    Resume Text: --- {resume_text} ---
    """
    try:
        response = llm.generate_content(prompt, generation_config=genai.types.GenerationConfig(response_mime_type="application/json"))
        return extract_json_from_response(response.text)
    except Exception as e:
        print(f"An error occurred with the Gemini API or JSON parsing: {e}")
        raise HTTPException(status_code=500, detail="Error processing resume with AI model.")

def generate_qualitative_analysis(resume_text: str, context: str, score: int) -> dict:
    """Uses the LLM to generate the human-like text analysis, GROUNDED by the custom model's score."""
    json_schema = ATSAnalysisOutput.model_json_schema()
    prompt = f"""
    **Persona:** You are an AI Career Strategist Platform.
    
    **Task:**
    A specialized, custom-trained machine learning model has analyzed a resume and determined the match score is **{score}%**.
    Your task is to provide the qualitative analysis that explains this score. Your response must be a single JSON object. Do not include the `match_score` in your JSON, as it is already known.

    **Analysis Instructions:**
    1.  **summary:** Write a detailed, professional summary that justifies the {score}% score.
    2.  **strengths:** Identify 3-5 key strengths of the resume for this context.
    3.  **areas_for_improvement:** Provide 3-5 actionable pieces of advice.
    4.  **keyword_analysis:** Identify matching and missing keywords.
    5.  **rewrite_suggestions (CRITICAL):**
        a. You MUST identify 2-3 weak bullet points from the resume.
        b. For EACH bullet, you MUST generate BOTH an `original_bullet` (an exact copy) AND a `suggested_improvement`.
        c. **SELF-CORRECTION:** Before finalizing your response, you MUST review your generated `rewrite_suggestions`. If any object is missing the `suggested_improvement` field, you must add it. This is a non-negotiable rule.

    **JSON Schema (excluding match_score):**
    {json.dumps({k: v for k, v in json_schema['properties'].items() if k != 'match_score'}, indent=2)}

    **Resume Text:**
    ---
    {resume_text}
    ---
    
    **Analysis Context:**
    ---
    {context}
    ---
    """
    try:
        response = llm.generate_content(prompt, generation_config=genai.types.GenerationConfig(response_mime_type="application/json"))
        return extract_json_from_response(response.text)
    except Exception as e:
        print(f"An error occurred during qualitative analysis: {e}")
        raise HTTPException(status_code=500, detail="Error generating qualitative analysis with LLM.")


# --- Job Search Helper Functions ---

def extract_keywords_from_resume(resume_text: str, top_k: int = 6) -> List[str]:
    tokens = re.findall(r'\b[a-zA-Z]{3,}\b', resume_text.lower())
    filtered = [token for token in tokens if token not in RESUME_STOPWORDS]
    counts = Counter(filtered)
    return [word for word, _ in counts.most_common(top_k)]


def infer_primary_role(resume_text: str) -> str:
    lowered = resume_text.lower()
    for role in ROLE_KEYWORDS:
        if role in lowered:
            return role
    return "software engineer"


def infer_required_fields(description: str) -> List[str]:
    description_lower = description.lower()
    requirements = []
    if any(keyword in description_lower for keyword in ["cover letter", "motivation letter"]):
        requirements.append("cover_letter")
    if any(keyword in description_lower for keyword in ["portfolio", "github", "dribbble", "behance"]):
        requirements.append("portfolio_link")
    if "salary expectation" in description_lower or "expected salary" in description_lower:
        requirements.append("salary_expectation")
    if any(keyword in description_lower for keyword in ["availability", "notice period"]):
        requirements.append("availability")
    return requirements


def _adzuna_request(keywords: str, loc: Optional[str], filters: Optional[JobSearchFilters], limit: int) -> Tuple[List[JobPosting], int]:
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        raise HTTPException(status_code=500, detail="Adzuna credentials are not configured.")

    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "what": keywords,
        "results_per_page": min(50, max(limit, 10)),
        "content-type": "application/json"
    }

    if loc:
        params["where"] = loc
        if filters and filters.distance_km:
            params["distance"] = filters.distance_km
    if filters:
        if filters.employment_type:
            params["contract"] = filters.employment_type
        if filters.salary_min:
            params["salary_min"] = filters.salary_min
        if filters.salary_max:
            params["salary_max"] = filters.salary_max

    endpoint = ADZUNA_ENDPOINT_TEMPLATE.format(country=ADZUNA_COUNTRY, page=1)
    try:
        response = requests.get(endpoint, params=params, timeout=15)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Job search provider error: {exc}")

    payload = response.json()
    adzuna_results = payload.get("results", [])

    jobs: List[JobPosting] = []
    for entry in adzuna_results:
        job_id = str(entry.get("id") or entry.get("adref") or entry.get("redirect_url"))
        company_data = entry.get("company") or {}
        location_data = entry.get("location") or {}
        salary_min = entry.get("salary_min")
        salary_max = entry.get("salary_max")
        salary_str = None
        if salary_min and salary_max:
            salary_str = f"{int(salary_min):,} - {int(salary_max):,}"
        elif salary_min:
            salary_str = f"From {int(salary_min):,}"
        elif salary_max:
            salary_str = f"Up to {int(salary_max):,}"

        description = entry.get("description") or entry.get("title") or ""
        job = JobPosting(
            id=job_id,
            title=entry.get("title", "Untitled Role"),
            company=company_data.get("display_name", "Company Confidential"),
            location=location_data.get("display_name"),
            salary=salary_str,
            description=description,
            url=entry.get("redirect_url"),
            source="Adzuna",
            posted_at=entry.get("created"),
            required_fields=infer_required_fields(description)
        )
        jobs.append(job)

    return jobs[:limit], payload.get("count", len(jobs))


def fetch_jobs_from_adzuna(resume_text: str, filters: Optional[JobSearchFilters], limit: int) -> Tuple[List[JobPosting], int, JobSearchFilters]:
    # Determine search keywords
    fallback_role = infer_primary_role(resume_text)
    derived_keywords = " ".join(extract_keywords_from_resume(resume_text, top_k=4)).strip()
    target_keywords = (filters.keywords or derived_keywords or fallback_role).strip()

    location = filters.location if filters else None

    jobs, total = _adzuna_request(target_keywords, location, filters, limit)

    # If nothing returned and user didn't explicitly set keywords, try fallback role without distance filter
    if not jobs and (not filters or not filters.keywords):
        jobs, total = _adzuna_request(fallback_role, location, filters, limit)
        target_keywords = fallback_role

    filters_used = JobSearchFilters(
        keywords=target_keywords or fallback_role,
        location=location,
        distance_km=filters.distance_km if filters and location else None,
        employment_type=filters.employment_type if filters else None,
        salary_min=filters.salary_min if filters else None,
        salary_max=filters.salary_max if filters else None,
    )

    return jobs, total, filters_used


def score_jobs_against_resume(resume_text: str, jobs: List[JobPosting]) -> List[JobPosting]:
    if not jobs:
        return jobs

    corpus = [resume_text] + [f"{job.title} {job.company} {job.description or ''}" for job in jobs]
    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform(corpus)
        resume_vec = tfidf_matrix[0]
        for idx, job in enumerate(jobs, start=1):
            job_vec = tfidf_matrix[idx]
            similarity = cosine_similarity(resume_vec, job_vec)[0][0]
            job.similarity_score = round(float(similarity), 3)
    except ValueError:
        for job in jobs:
            job.similarity_score = 0.0
    return jobs


# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Next Hire API! 🚀"}

@app.post("/api/v1/resumes/parse", response_model=ResumeOutput)
async def parse_resume(resume_in: ResumeInput):
    """Receives raw resume text and returns a structured JSON analysis."""
    parsed_data = parse_resume_with_ai(resume_in.resume_text)
    return ResumeOutput(**parsed_data)

@app.post("/api/v1/resumes/analyze-ats", response_model=ATSAnalysisOutput)
async def analyze_ats(ats_in: ATSAnalysisInput):
    """Receives resume and job context to perform a HYBRID ATS analysis."""
    
    jd_text_for_model = ""
    analysis_context = ""
    
    if ats_in.job_description:
        analysis_context = f"Job Description:\\n---\\n{ats_in.job_description}\\n---"
        jd_text_for_model = ats_in.job_description
    elif ats_in.career_level:
        analysis_context = f"Target Career Level: {ats_in.career_level}"
        jd_text_for_model = f"A typical job description for a {ats_in.career_level} role requiring relevant skills and experience."
    else:
        raise HTTPException(status_code=400, detail="Either 'job_description' or 'career_level' must be provided.")
    
    predicted_score = predict_score_with_custom_model(
        resume_text=ats_in.resume_text,
        jd_text=jd_text_for_model
    )
    
    qualitative_data = generate_qualitative_analysis(
        resume_text=ats_in.resume_text,
        context=analysis_context,
        score=predicted_score
    )
    
    final_response = {
        "match_score": predicted_score,
        **qualitative_data
    }
    
    return ATSAnalysisOutput(**final_response)


@app.post("/api/v1/jobs/search", response_model=JobSearchResponse)
async def search_jobs(job_input: JobSearchInput):
    jobs, total_results, filters_used = fetch_jobs_from_adzuna(
        resume_text=job_input.resume_text,
        filters=job_input.filters,
        limit=job_input.limit
    )
    ranked_jobs = score_jobs_against_resume(job_input.resume_text, jobs)
    ranked_jobs.sort(key=lambda job: job.similarity_score or 0, reverse=True)
    return JobSearchResponse(
        jobs=ranked_jobs,
        total_results=total_results,
        filters_used=filters_used
    )


@app.post("/api/v1/jobs/apply", response_model=JobApplyResponse)
async def apply_to_job(payload: JobApplyInput):
    missing_fields = [
        field for field in payload.required_fields
        if not payload.provided_fields.get(field)
    ]

    if missing_fields:
        return JobApplyResponse(
            job_id=payload.job_id,
            status="needs_more_info",
            missing_fields=missing_fields,
            message=f"Additional information required for {payload.job_title}."
        )

    # Placeholder success response – in a real integration we'd call the provider's apply API here.
    return JobApplyResponse(
        job_id=payload.job_id,
        status="submitted",
        missing_fields=[],
        message=f"Application submitted to {payload.company}. We'll notify you if the provider needs more information."
    )


@app.post("/api/v1/jobs/apply-all", response_model=List[JobApplyResponse])
async def apply_to_all_jobs(payload: JobApplyAllInput):
    responses: List[JobApplyResponse] = []
    for job in payload.jobs:
        missing_fields = [
            field for field in job.required_fields
            if not job.provided_fields.get(field)
        ]
        status = "needs_more_info" if missing_fields else "submitted"
        message = (
            f"More details needed for {job.job_title}."
            if missing_fields else
            f"Application submitted to {job.company}."
        )
        responses.append(JobApplyResponse(
            job_id=job.job_id,
            status=status,
            missing_fields=missing_fields,
            message=message
        ))
    return responses

