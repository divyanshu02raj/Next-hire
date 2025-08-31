# backend/main.py

import os
import json
import re
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import your Pydantic models
from app.models import ResumeInput, ResumeOutput, ATSAnalysisInput, ATSAnalysisOutput

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
    # Find the JSON block within the response text, ignoring potential markdown
    match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
    if match:
        json_str = match.group(1)
    else:
        # Fallback for plain JSON without markdown
        start_index = response_text.find('{')
        end_index = response_text.rfind('}') + 1
        if start_index != -1 and end_index != 0:
            json_str = response_text[start_index:end_index]
        else:
            raise ValueError("No valid JSON object found in the AI response.")
    return json.loads(json_str)

# --- AI Parsing Functions ---

def parse_resume_with_ai(resume_text: str) -> dict:
    """Sends resume text to Gemini and asks it to return structured JSON."""
    json_schema = ResumeOutput.model_json_schema()
    prompt = f"""
    You are an expert resume parser. Your task is to extract information into a structured JSON object
    that strictly adheres to the provided schema. Do not add any extra explanations.

    **CRITICAL INSTRUCTIONS FOR PROJECT URLS:**
    The resume text below may contain a special section at the end, marked with "--- Extracted Hyperlinks ---".
    This section contains a definitive list of all URLs found in the original document. For each project you identify,
    find its corresponding URL from this list and place it in the 'url' field. If no matching URL is found, leave the 'url' field as null.

    JSON Schema:
    {json.dumps(json_schema, indent=2)}

    Resume Text:
    ---
    {resume_text}
    ---
    """
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        return extract_json_from_response(response.text)
    except Exception as e:
        print(f"An error occurred with the Gemini API or JSON parsing: {e}")
        raise HTTPException(status_code=500, detail="Error processing resume with AI model.")

def analyze_ats_with_ai(resume_text: str, job_description: str) -> dict:
    """Compares a resume to a job description to generate an ATS score."""
    json_schema = ATSAnalysisOutput.model_json_schema()
    prompt = f"""
    You are a sophisticated Applicant Tracking System (ATS). Your task is to analyze the provided resume against the given job description
    and return a structured JSON object that strictly adheres to the following schema.

    **Analysis Instructions:**
    1.  **match_score:** Calculate a score from 0 to 100 representing how well the resume matches the job description. Consider skills, experience, and education.
    2.  **matching_keywords:** Identify and list the key skills and technologies present in BOTH the resume and the job description.
    3.  **missing_keywords:** Identify and list the key skills and technologies required by the job description that are MISSING from the resume.
    4.  **summary:** Provide a brief, professional summary explaining the match score and highlighting the candidate's key strengths and weaknesses for this specific role.

    JSON Schema:
    {json.dumps(json_schema, indent=2)}

    Resume Text:
    ---
    {resume_text}
    ---

    Job Description:
    ---
    {job_description}
    ---
    """
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        return extract_json_from_response(response.text)
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
    """Receives resume and job description to perform an ATS analysis."""
    analysis_data = analyze_ats_with_ai(ats_in.resume_text, ats_in.job_description)
    return ATSAnalysisOutput(**analysis_data)

