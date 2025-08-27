# backend\app\models.py
from pydantic import BaseModel, Field
from typing import List, Optional

class ResumeInput(BaseModel):
    """The input data sent from the frontend."""
    resume_text: str = Field(..., example="John Doe\nAustin, TX\njohn.doe@email.com...")

class WorkExperience(BaseModel):
    job_title: str
    company: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: List[str]

class Education(BaseModel):
    degree: str
    institution: str
    location: Optional[str] = None
    graduation_date: Optional[str] = None

class ResumeOutput(BaseModel):
    """The structured data returned by the API after analysis."""
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    linkedin_url: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str] = []
    work_experience: List[WorkExperience] = []
    education: List[Education] = []