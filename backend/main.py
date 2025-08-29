import os
import json
import re
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
# Reads the allowed origins from an environment variable for security
origins_str = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in origins_str.split(',')]

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
    You are an expert resume parser. Your task is to extract information into a structured JSON object
    that strictly adheres to the provided schema. Do not add any extra explanations.

    **CRITICAL INSTRUCTIONS FOR PROJECT URLS:**
    The resume text below may contain a special section at the end, marked with "--- Extracted Hyperlinks ---".
    This section contains a definitive list of all URLs found in the original document, including those that were hyperlinked to words like "Demo" or "Live Project".

    Follow these rules to find the URL for each project:
    1.  **Primary Method (Association):** For each project you identify, your main goal is to find its corresponding URL from the "Extracted Hyperlinks" list. Associate a URL with a project based on context, project titles, or surrounding text. This is the most reliable way to get the correct link.
    2.  **Secondary Method (In-text Search):** If you cannot confidently associate a pre-extracted URL with a project, then (and only then) search that project's description for an explicitly written-out URL (e.g., "https://...").
    3.  **Final Rule:** If you cannot find a URL for a project using either of these methods, you MUST leave the 'url' field as null. Do not use placeholder words like "demo" as the URL.

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
        # --- Robust JSON Parsing ---
        # Find the JSON block within the response text, ignoring potential markdown
        response_text = response.text
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

    except Exception as e:
        print(f"An error occurred with the Gemini API or JSON parsing: {e}")
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

