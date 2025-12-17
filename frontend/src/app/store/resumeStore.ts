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

export interface JobPosting {
    id: string;
    title: string;
    company: string;
    location?: string | null;
    salary?: string | null;
    description?: string | null;
    url: string;
    source: string;
    posted_at?: string | null;
    similarity_score?: number | null;
    required_fields?: string[];
}

export interface JobFilters {
    keywords?: string;
    location?: string;
    distanceKm?: number;
    employmentType?: string;
}

// --- Zustand Store Definition ---

// Defines the shape of our store's state
interface ResumeStoreState {
    resumeData: ResumeData | null;
    rawResumeText: string | null;
    setResumeData: (data: ResumeData) => void;
    setRawResumeText: (text: string) => void;
    jobMatches: JobPosting[];
    jobFilters: JobFilters;
    bookmarkedJobIds: string[];
    appliedJobIds: string[];
    dismissedJobIds: string[];
    swipeOverlayOpen: boolean;
    setJobMatches: (jobs: JobPosting[]) => void;
    setJobFilters: (filters: Partial<JobFilters>) => void;
    toggleBookmark: (job: JobPosting) => void;
    markJobApplied: (jobId: string) => void;
    dismissJob: (jobId: string) => void;
    setSwipeOverlayOpen: (open: boolean) => void;
}

// Create the store with state and actions
const defaultFilters: JobFilters = {
    keywords: '',
    location: '',
    distanceKm: 50,
    employmentType: 'any',
};

export const useResumeStore = create<ResumeStoreState>((set, get) => ({
    resumeData: null,
    rawResumeText: null,
    setResumeData: (data) => set({ resumeData: data }),
    setRawResumeText: (text) => set({ rawResumeText: text }),
    jobMatches: [],
    jobFilters: defaultFilters,
    bookmarkedJobIds: [],
    appliedJobIds: [],
    dismissedJobIds: [],
    swipeOverlayOpen: false,
    setJobMatches: (jobs) => set({ jobMatches: jobs }),
    setJobFilters: (filters) => set({
        jobFilters: { ...get().jobFilters, ...filters },
    }),
    toggleBookmark: (job) => set((state) => {
        const exists = state.bookmarkedJobIds.includes(job.id);
        return {
            bookmarkedJobIds: exists
                ? state.bookmarkedJobIds.filter((id) => id !== job.id)
                : [...state.bookmarkedJobIds, job.id],
        };
    }),
    markJobApplied: (jobId) => set((state) => ({
        appliedJobIds: state.appliedJobIds.includes(jobId)
            ? state.appliedJobIds
            : [...state.appliedJobIds, jobId],
    })),
    dismissJob: (jobId) => set((state) => ({
        dismissedJobIds: state.dismissedJobIds.includes(jobId)
            ? state.dismissedJobIds
            : [...state.dismissedJobIds, jobId],
    })),
    setSwipeOverlayOpen: (open) => set({ swipeOverlayOpen: open }),
}));