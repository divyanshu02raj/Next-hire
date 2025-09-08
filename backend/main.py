# backend\main.py
import os
import json
import re
import random
from typing import Optional, List
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import your Pydantic models
from app.models import (
    ResumeInput, ResumeOutput, ATSAnalysisInput, ATSAnalysisOutput,
    RewriteSuggestion
)

# Load environment variables from .env file
load_dotenv()

# --- Gemini API Configuration ---
try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
    model = genai.GenerativeModel('gemini-1.5-flash')
except KeyError:
    raise RuntimeError("GOOGLE_API_KEY not found. Please ensure it's in a .env file in your backend directory.")


# --- FastAPI App Initialization ---
app = FastAPI(
    title="Next Hire API",
    description="API for the AI-powered job search platform.",
    version="0.1.0",
)

# --- CORS Configuration ---
origins_str = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in origins_str.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper function for robust JSON parsing ---
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

# --- AI Parsing Functions ---

def parse_resume_with_ai(resume_text: str) -> dict:
    """Sends resume text to Gemini and asks it to return structured, categorized JSON."""
    json_schema = ResumeOutput.model_json_schema()
    
    prompt = f"""
    You are an expert, highly meticulous resume parser. Your task is to extract information into a structured JSON object
    that strictly adheres to the provided schema. Do not add any extra explanations or text outside the JSON object.
    **Detailed Extraction Instructions:**
    1.  **Contact Info:** Extract all personal details.
    2.  **Categorized Skills:** Analyze and group all skills into the correct categories.
    3.  **Certifications & Languages:** Extract any certifications and languages listed.
    4.  **Project URLs:** Use the "--- Extracted Hyperlinks ---" section to find the correct URL for each project.
    JSON Schema:
    {json.dumps(json_schema, indent=2)}
    Resume Text:
    ---
    {resume_text}
    ---
    """
    try:
        response = model.generate_content(prompt, generation_config=genai.types.GenerationConfig(response_mime_type="application/json"))
        return extract_json_from_response(response.text)
    except Exception as e:
        print(f"An error occurred with the Gemini API or JSON parsing: {e}")
        raise HTTPException(status_code=500, detail="Error processing resume with AI model.")

# --- TWO-STAGE AI PIPELINE FOR RELIABLE REWRITES ---

def identify_improvable_bullets(resume_text: str, context: str) -> List[str]:
    """Stage 1: AI identifies a POOL of improvable bullet points."""
    prompt = f"""
    You are a Senior Technical Recruiter. Your task is to identify up to 5-7 bullet points from the 'Work Experience' or 'Projects'
    sections of the provided resume that have the most potential for improvement to better match the analysis context.
    Return ONLY a JSON list of strings, where each string is the exact, verbatim text of an improvable bullet point.

    Example Response:
    ["Developed a new feature.", "Worked on a team project using React.", "Responsible for bug fixes."]

    Resume Text:
    ---
    {resume_text}
    ---

    Analysis Context:
    ---
    {context}
    ---
    """
    try:
        response = model.generate_content(prompt, generation_config=genai.types.GenerationConfig(response_mime_type="application/json"))
        improvable_bullets = json.loads(response.text)
        if isinstance(improvable_bullets, list):
            return improvable_bullets
        return []
    except Exception:
        return []

def refine_bullet_point(bullet: str, context: str) -> str:
    """Stage 2: AI refines a single, specific bullet point."""
    prompt = f"""
    You are an expert resume writer. Your task is to rewrite the following single bullet point to be more impactful and better aligned with the provided analysis context.
    Focus on quantifying achievements and using action verbs. Do not add any information that is not present in the original bullet.
    Return ONLY the rewritten bullet point as a single string.

    Original Bullet Point: "{bullet}"

    Analysis Context: "{context}"
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return bullet

def analyze_ats_with_ai(resume_text: str, job_description: Optional[str] = None, career_level: Optional[str] = None) -> dict:
    """Performs the main ATS analysis and then runs the two-stage pipeline for rewrite suggestions."""
    json_schema = ATSAnalysisOutput.model_json_schema()
    persona, evaluation_philosophy, analysis_context = "", "", ""

    if job_description:
        persona = "You are an expert, highly critical and discerning Senior Technical Recruiter and Career Strategist AI."
        analysis_context = f"Job Description:\\n---\\n{job_description}\\n---"
        evaluation_philosophy = "Score the resume based on direct alignment with the specific job description."
    elif career_level:
        analysis_context = f"Target Career Level: {career_level}"
        if career_level == 'Entry Level':
            persona = "You are a University Recruiter looking for potential."
            evaluation_philosophy = "Construct a mental model of an Ideal Entry-Level Candidate (skills, projects, internships) and score the resume against it."
        elif career_level == 'Mid Level':
            persona = "You are a Technical Recruiter hiring for mid-level engineers (2-5 years experience). You are looking for proven ability."
            evaluation_philosophy = "Construct a mental model of an Ideal Mid-Level Candidate (2-5 years experience, quantifiable impact) and score against it."
        elif career_level == 'Senior Level':
            persona = "You are an Executive Recruiter hiring for senior roles (5+ years). You are looking for strategic impact."
            evaluation_philosophy = "Construct a mental model of an Ideal Senior-Level Candidate (leadership, mentorship, business impact) and score against it."
    else:
        raise ValueError("Either job_description or career_level must be provided.")

    main_prompt = f"""
    **Persona:** {persona}
    **Task:**
    {evaluation_philosophy}
    After your evaluation, provide a detailed analysis in a single JSON object.
    **Rules:** The score must be specific (e.g., 87, not 85). The `rewrite_suggestions` field in the schema should be an EMPTY LIST for now. You will not generate suggestions in this step.
    **JSON Schema:**
    {json.dumps(json_schema, indent=2)}
    **Resume Text:**
    ---
    {resume_text}
    ---
    **Analysis Context:**
    {analysis_context}
    """
    try:
        response = model.generate_content(main_prompt, generation_config=genai.types.GenerationConfig(response_mime_type="application/json"))
        analysis_data = extract_json_from_response(response.text)

        # --- RUN THE TWO-STAGE PIPELINE with RANDOMIZATION ---
        # Stage 1: Identify a POOL of improvable bullets
        bullet_pool = identify_improvable_bullets(resume_text, analysis_context)
        
        # Determine how many bullets to select (up to 3)
        num_to_select = min(len(bullet_pool), 3)
        
        # Randomly select bullets from the pool
        selected_bullets = random.sample(bullet_pool, num_to_select) if bullet_pool else []

        # Stage 2: Refine each randomly selected bullet
        rewrite_suggestions = []
        for bullet in selected_bullets:
            if bullet:
                improved_bullet = refine_bullet_point(bullet, analysis_context)
                rewrite_suggestions.append(RewriteSuggestion(original_bullet=bullet, suggested_improvement=improved_bullet))
        
        analysis_data['rewrite_suggestions'] = rewrite_suggestions
        return analysis_data

    except Exception as e:
        print(f"An error occurred with the Gemini API or JSON parsing: {e}")
        raise HTTPException(status_code=500, detail="Error performing ATS analysis with AI model.")

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Next Hire API! 🚀"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/v1/resumes/parse", response_model=ResumeOutput)
async def parse_resume(resume_in: ResumeInput):
    """Receives raw resume text and returns a structured JSON analysis."""
    parsed_data = parse_resume_with_ai(resume_in.resume_text)
    return ResumeOutput(**parsed_data)

@app.post("/api/v1/resumes/analyze-ats", response_model=ATSAnalysisOutput)
async def analyze_ats(ats_in: ATSAnalysisInput):
    """Receives resume and job context to perform an ATS analysis."""
    if not ats_in.job_description and not ats_in.career_level:
        raise HTTPException(status_code=400, detail="Either 'job_description' or 'career_level' must be provided.")
    
    analysis_data = analyze_ats_with_ai(
        resume_text=ats_in.resume_text, 
        job_description=ats_in.job_description,
        career_level=ats_in.career_level
    )
    return ATSAnalysisOutput(**analysis_data)

