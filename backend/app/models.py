from pydantic import BaseModel, Field
from typing import List, Optional

# --- Resume Parsing Models ---

class ResumeInput(BaseModel):
    """The input data sent from the frontend for initial parsing."""
    resume_text: str = Field(..., example="John Doe\nAustin, TX\njohn.doe@email.com...")

# --- NEW: Enhanced Data Structures ---

class CategorizedSkills(BaseModel):
    programming_languages: Optional[List[str]] = Field([], description="Programming languages like Python, JavaScript.")
    frameworks_and_libraries: Optional[List[str]] = Field([], description="Frameworks and libraries like React, Node.js, TensorFlow.")
    databases: Optional[List[str]] = Field([], description="Databases like PostgreSQL, MongoDB.")
    cloud_technologies: Optional[List[str]] = Field([], description="Cloud platforms and tools like AWS, Docker, Kubernetes.")
    tools_and_platforms: Optional[List[str]] = Field([], description="Development tools like Git, Jira, Postman.")

class Certification(BaseModel):
    name: Optional[str] = None
    organization: Optional[str] = None
    date: Optional[str] = None

class Language(BaseModel):
    language: Optional[str] = None
    proficiency: Optional[str] = Field(None, description="e.g., Fluent, Conversational, Professional.")

# --- Core Data Structures ---

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
    tech_stack: Optional[List[str]] = Field([], description="Specific technologies used in the project.")
    url: Optional[str] = None

# --- Main Output Model (UPGRADED) ---

class ResumeOutput(BaseModel):
    """The structured data returned by the API after initial parsing."""
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    summary: Optional[str] = None
    categorized_skills: Optional[CategorizedSkills] = None # Replaces simple skills list
    work_experience: List[WorkExperience] = []
    education: List[Education] = []
    projects: List[Project] = []
    certifications: List[Certification] = []
    achievements: List[str] = []
    publications: List[str] = []
    languages: List[Language] = []

# --- ATS Analysis Models ---

class RewriteSuggestion(BaseModel):
    original_bullet: str = Field(..., description="The exact, original bullet point from the resume.")
    suggested_improvement: str = Field(..., description="The AI's rewritten, improved version of the bullet point.")

class KeywordAnalysis(BaseModel):
    matching_keywords: List[str] = Field([], description="Keywords found in both the resume and context.")
    missing_keywords: List[str] = Field([], description="Important keywords from the context that are missing in the resume.")

class ATSAnalysisInput(BaseModel):
    """The input data for the ATS analysis endpoint."""
    resume_text: str
    job_description: Optional[str] = None
    career_level: Optional[str] = None

class ATSAnalysisOutput(BaseModel):
    """The structured data returned by the ATS analysis."""
    match_score: int = Field(..., description="A score from 0 to 100 representing the match level.")
    summary: str = Field(..., description="A detailed summary of the candidate's fit for the role.")
    strengths: List[str] = Field([], description="Specific strengths of the resume for this context.")
    areas_for_improvement: List[str] = Field([], description="Actionable advice for improving the resume.")
    keyword_analysis: KeywordAnalysis
    rewrite_suggestions: List[RewriteSuggestion] = []

