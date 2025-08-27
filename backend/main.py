# backend\main.py
import os
import json
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import your Pydantic models
from app.models import ResumeInput, ResumeOutput

# Load environment variables from .env file
load_dotenv()

# --- Gemini API Configuration ---
try:
    gemini_api_key = os.environ["GOOGLE_API_KEY"]
    if not gemini_api_key:
        raise KeyError
    genai.configure(api_key=gemini_api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
except KeyError:
    raise RuntimeError("GOOGLE_API_KEY not found or is empty. Please ensure it's in a .env file in your backend directory.")


# --- FastAPI App Initialization ---
app = FastAPI(
    title="Next Hire API",
    description="API for the AI-powered job search platform.",
    version="0.1.0",
)

# --- CORS Configuration from Environment Variable ---
# Read the comma-separated string from the environment variable
cors_origins_str = os.getenv("CORS_ORIGINS", "") 
# Split the string into a list of origins
origins = [origin.strip() for origin in cors_origins_str.split(",") if origin]

# If no origins are specified in the .env, default to a restrictive policy for safety
if not origins:
    print("Warning: CORS_ORIGINS environment variable not set. No origins will be allowed.")
    origins = []


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# --- Helper function for AI parsing ---
def parse_resume_with_ai(resume_text: str) -> dict:
    """Sends resume text to Gemini and asks it to return structured JSON."""
    
    json_schema = ResumeOutput.model_json_schema()
    
    prompt = f"""
    You are an expert resume parser. Analyze the following resume text and extract the information
    into a structured JSON object. The JSON object must strictly adhere to the following schema.
    Do not add any extra explanations or introductory text outside of the JSON object.

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
        return json.loads(response.text)
    except Exception as e:
        print(f"An error occurred with the Gemini API: {e}")
        raise HTTPException(status_code=500, detail="Error processing resume with AI model.")


# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Next Hire API! 🚀"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/v1/resumes/parse", response_model=ResumeOutput)
async def parse_resume(resume_in: ResumeInput):
    """
    Receives raw resume text and returns a structured JSON analysis.
    """
    parsed_data = parse_resume_with_ai(resume_in.resume_text)
    return ResumeOutput(**parsed_data)