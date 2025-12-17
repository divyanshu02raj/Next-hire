# backend\app\models.py
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict

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
    categorized_skills: Optional[CategorizedSkills] = None 
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

# --- Jobs & Application Models ---

class JobSearchFilters(BaseModel):
    keywords: Optional[str] = Field(None, description="Keywords or role names to search for.")
    location: Optional[str] = Field(None, description="Preferred job location.")
    distance_km: Optional[int] = Field(50, ge=1, le=100, description="Radius for search results.")
    employment_type: Optional[str] = Field(None, description="fulltime, parttime, contract, internship.")
    salary_min: Optional[int] = Field(None, description="Minimum salary expectation.")
    salary_max: Optional[int] = Field(None, description="Maximum salary expectation.")


class JobPosting(BaseModel):
    id: str
    title: str
    company: str
    location: Optional[str] = None
    salary: Optional[str] = None
    description: Optional[str] = None
    url: HttpUrl
    source: str = "Adzuna"
    posted_at: Optional[str] = None
    similarity_score: Optional[float] = Field(None, description="0-1 similarity against resume.")
    required_fields: List[str] = Field([], description="Fields we may need to prompt the candidate for.")


class JobSearchInput(BaseModel):
    resume_text: str = Field(..., description="Raw resume text used for personalization.")
    filters: Optional[JobSearchFilters] = None
    limit: int = Field(10, ge=1, le=25)


class JobSearchResponse(BaseModel):
    jobs: List[JobPosting]
    total_results: int
    filters_used: JobSearchFilters


class JobApplicationPayload(BaseModel):
    job_id: str
    job_title: str
    company: str
    apply_url: HttpUrl
    required_fields: List[str] = []
    provided_fields: Dict[str, str] = {}


class JobApplyInput(JobApplicationPayload):
    resume_text: str


class JobApplyResponse(BaseModel):
    job_id: str
    status: str
    missing_fields: List[str] = []
    message: Optional[str] = None


class JobApplyAllInput(BaseModel):
    resume_text: str
    jobs: List[JobApplicationPayload]


