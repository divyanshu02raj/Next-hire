// frontend\src\app\store\resumeStore.ts

import { create } from 'zustand';

// Define the structure of our resume data, mirroring the Pydantic models
interface ResumeData {
  full_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  linkedin_url?: string | null;
  summary?: string | null;
  skills?: string[];
  work_experience?: {
    job_title?: string | null;
    company?: string | null;
    location?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    description?: string[];
  }[];
  education?: {
    degree?: string | null;
    institution?: string | null;
    location?: string | null;
    graduation_date?: string | null;
  }[];
}

// Define the state and the actions to modify it
interface ResumeState {
  resumeData: ResumeData | null;
  setResumeData: (data: ResumeData) => void;
  clearResumeData: () => void;
}

// Create the store
export const useResumeStore = create<ResumeState>((set) => ({
  resumeData: null,
  setResumeData: (data) => set({ resumeData: data }),
  clearResumeData: () => set({ resumeData: null }),
}));
