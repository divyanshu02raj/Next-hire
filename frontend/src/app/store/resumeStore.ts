import { create } from 'zustand';

// --- Type Definitions for the Resume Data Structure ---

interface WorkExperience {
    job_title?: string | null;
    company?: string | null;
    location?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    description?: string[];
}

interface Education {
    degree?: string | null;
    institution?: string | null;
    location?: string | null;
    graduation_date?: string | null;
}

interface Project {
    name?: string | null; // This was the missing field
    technologies?: string[] | null;
    description?: string[] | null;
    url?: string | null;
}

// This is the main data structure for the entire resume
interface ResumeData {
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

interface ResumeStore {
    resumeData: ResumeData | null;
    setResumeData: (data: ResumeData) => void;
}

export const useResumeStore = create<ResumeStore>((set) => ({
    resumeData: null,
    setResumeData: (data) => set({ resumeData: data }),
}));

