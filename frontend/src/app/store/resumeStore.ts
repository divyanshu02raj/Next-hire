// frontend/src/app/store/resumeStore.ts
import { create } from 'zustand';

// --- Type Definitions for our data structures ---

// Represents a single work experience entry
export interface WorkExperience {
    job_title?: string | null;
    company?: string | null;
    location?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    description?: string[];
}

// Represents a single education entry
export interface Education {
    degree?: string | null;
    institution?: string | null;
    location?: string | null;
    graduation_date?: string | null;
}

// Represents a single project entry
export interface Project {
    name?: string | null;
    description?: string[] | null;
    url?: string | null;
    tech_stack?: string[] | null; // <-- ADDED
}

// Represents categorized skills
export interface CategorizedSkills {
    programming_languages?: string[];
    frameworks_libraries?: string[];
    databases?: string[];
    cloud_technologies?: string[];
    tools_platforms?: string[];
}

// Represents a professional certification
export interface Certification {
    name?: string | null;
    organization?: string | null;
    date?: string | null;
}

// Represents the entire, enhanced resume data
export interface ResumeData {
    full_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    location?: string | null; // <-- ADDED
    linkedin_url?: string | null;
    github_url?: string | null;
    portfolio_url?: string | null; // <-- ADDED
    summary?: string | null;
    categorized_skills?: CategorizedSkills; // <-- UPGRADED
    work_experience?: WorkExperience[];
    education?: Education[];
    projects?: Project[];
    certifications?: Certification[]; // <-- ADDED
    achievements?: string[];
    publications?: string[]; // <-- ADDED
    languages?: { language: string; proficiency: string }[]; // <-- ADDED
}

// --- Zustand Store Definition ---

// Defines the shape of our store's state
interface ResumeStoreState {
    resumeData: ResumeData | null;
    rawResumeText: string | null;
    setResumeData: (data: ResumeData) => void;
    setRawResumeText: (text: string) => void;
}

// Create the store with state and actions
export const useResumeStore = create<ResumeStoreState>((set) => ({
    resumeData: null,
    rawResumeText: null,
    setResumeData: (data) => set({ resumeData: data }),
    setRawResumeText: (text) => set({ rawResumeText: text }),
}));