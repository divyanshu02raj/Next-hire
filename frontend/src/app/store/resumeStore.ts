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

// Represents the entire structured resume data
export interface ResumeData {
    full_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    linkedin_url?: string | null;
    github_url?: string | null;
    summary?: string | null;
    skills?: string[];
    work_experience?: WorkExperience[];
    education?: Education[];
    projects?: Project[];
    achievements?: string[];
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