import os
import json
import re
import random
import joblib
import scipy.sparse as sp
import numpy as np
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import your Pydantic models
from app.models import (
    ResumeInput, ResumeOutput, ATSAnalysisInput, ATSAnalysisOutput,
    RewriteSuggestion, CategorizedSkills, Certification, Language
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

