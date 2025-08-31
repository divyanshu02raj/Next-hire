from pydantic import BaseModel, Field
from typing import List, Optional

# --- Resume Parsing Models ---

class ResumeInput(BaseModel):
    """The input data sent from the frontend for initial parsing."""
    resume_text: str = Field(..., example="John Doe\nAustin, TX\njohn.doe@email.com...")

class WorkExperience(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[List[str]] = None

class Education(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    location: Optional[str] = None
    graduation_date: Optional[str] = None

class Project(BaseModel):
    name: Optional[str] = None
    description: Optional[List[str]] = None
    url: Optional[str] = None

class ResumeOutput(BaseModel):
    """The structured data returned by the API after initial parsing."""
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str] = []
    work_experience: List[WorkExperience] = []
    education: List[Education] = []
    projects: List[Project] = []
    achievements: List[str] = []

# --- ATS Analysis Models ---

class ATSAnalysisInput(BaseModel):
    """The input data for the ATS analysis endpoint."""
    resume_text: str
    job_description: str

class ATSAnalysisOutput(BaseModel):
    """The structured data returned by the ATS analysis."""
    match_score: int = Field(..., description="A score from 0 to 100 representing the match level.")
    matching_keywords: List[str] = Field(..., description="Keywords found in both the resume and job description.")
    missing_keywords: List[str] = Field(..., description="Keywords found in the job description but not in the resume.")
    summary: str = Field(..., description="A brief summary of why the resume is a good or bad fit.")

