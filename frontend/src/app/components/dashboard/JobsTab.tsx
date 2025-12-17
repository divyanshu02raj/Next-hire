'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import {
    Search,
    MapPin,
    Filter,
    Briefcase,
    Bookmark,
    BookmarkCheck,
    ExternalLink,
    Loader2,
    Wand2,
    RotateCcw,
    Sparkles,
    ArrowUpCircle,
    ThumbsDown,
    Heart,
    X,
    Check,
    Sliders,
} from 'lucide-react';
import { useResumeStore, JobPosting, JobFilters } from '@/app/store/resumeStore';

interface JobSearchResponse {
    jobs: JobPosting[];
    total_results: number;
    filters_used: JobFilters;
}

interface SwipeOverlayProps {
    jobs: JobPosting[];
    isOpen: boolean;
    onClose: () => void;
    onApply: (job: JobPosting) => void;
    onBookmark: (job: JobPosting) => void;
    onDismiss: (job: JobPosting) => void;
}

const fieldLabels: Record<string, string> = {
    cover_letter: 'Cover Letter',
    portfolio_link: 'Portfolio Link',
    salary_expectation: 'Salary Expectation',
    availability: 'Availability / Notice Period',
};

const getFieldPlaceholder = (field: string) => {
    switch (field) {
        case 'cover_letter':
            return 'Paste or draft a short cover letter...';
        case 'portfolio_link':
            return 'https://portfolio.example.com';
        case 'salary_expectation':
            return 'e.g., ₹18 LPA';
        case 'availability':
            return 'e.g., 30 days notice';
        default:
            return '';
    }
};

const SwipeOverlay = ({ jobs, isOpen, onClose, onApply, onBookmark, onDismiss }: SwipeOverlayProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const dragStart = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
            setDragOffset({ x: 0, y: 0 });
        }
    }, [isOpen]);

    const activeJob = jobs[currentIndex];

    const handleDecision = (action: 'apply' | 'bookmark' | 'dismiss') => {
        if (!activeJob) {
            onClose();
            return;
        }
        if (action === 'apply') {
            onApply(activeJob);
        } else if (action === 'bookmark') {
            onBookmark(activeJob);
        } else {
            onDismiss(activeJob);
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex >= jobs.length) {
            onClose();
        } else {
            setCurrentIndex(nextIndex);
            setDragOffset({ x: 0, y: 0 });
        }
    };

    const resetDrag = () => {
        dragStart.current = null;
        setDragOffset({ x: 0, y: 0 });
    };

    const handlePointerDown = (clientX: number, clientY: number) => {
        dragStart.current = { x: clientX, y: clientY };
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
        if (!dragStart.current) return;
        setDragOffset({
            x: clientX - dragStart.current.x,
            y: clientY - dragStart.current.y,
        });
    };

    const handlePointerUp = () => {
        if (!dragStart.current) return;
        const deltaX = dragOffset.x;
        const deltaY = dragOffset.y;
        resetDrag();
        if (deltaY < -80) {
            handleDecision('apply');
        } else if (deltaX > 80) {
            handleDecision('bookmark');
        } else if (deltaX < -80) {
            handleDecision('dismiss');
        }
    };

    if (!isOpen || !activeJob) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center px-4">
            <div className="absolute top-6 right-6 flex items-center gap-3 text-white">
                <span>{currentIndex + 1} / {jobs.length}</span>
                <button onClick={onClose} className="rounded-full border border-white/40 p-2 hover:bg-white/10 transition-colors">
                    <X />
                </button>
            </div>
            <div
                className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 select-none"
                style={{
                    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.03}deg)`,
                    touchAction: 'none',
                }}
                onPointerDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                onPointerMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                onPointerUp={handlePointerUp}
                onPointerLeave={resetDrag}
                onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={handlePointerUp}
            >
                <div className="flex flex-col gap-3">
                    <p className="text-sm uppercase tracking-widest text-primary font-semibold">Swipe Mode</p>
                    <h3 className="text-2xl font-bold text-dark dark:text-light">{activeJob.title}</h3>
                    <p className="text-stone-500 dark:text-stone-300">{activeJob.company} · {activeJob.location}</p>
                    <p className="text-sm text-stone-500">{activeJob.description?.slice(0, 220)}...</p>
                    <div className="flex flex-wrap gap-3 pt-4">
                        <button
                            className="flex-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 rounded-2xl py-3 flex items-center justify-center gap-2"
                            onClick={() => handleDecision('dismiss')}
                        >
                            <ThumbsDown />
                            Pass
                        </button>
                        <button
                            className="flex-1 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-2xl py-3 flex items-center justify-center gap-2"
                            onClick={() => handleDecision('bookmark')}
                        >
                            <Bookmark />
                            Save
                        </button>
                    </div>
                    <button
                        className="mt-3 w-full bg-primary text-white rounded-2xl py-3 flex items-center justify-center gap-2 text-lg font-semibold"
                        onClick={() => handleDecision('apply')}
                    >
                        <ArrowUpCircle />
                        Swipe Up to Auto-Apply
                    </button>
                    <p className="text-xs text-center text-stone-400 mt-2">
                        Swipe up to apply, right to bookmark, left to pass. Drag the card or use the buttons.
                    </p>
                </div>
            </div>
        </div>
    );
};

const JobsTab = () => {
    const {
        rawResumeText,
        jobMatches,
        jobFilters,
        setJobMatches,
        setJobFilters,
        bookmarkedJobIds,
        toggleBookmark,
        appliedJobIds,
        markJobApplied,
        dismissedJobIds,
        dismissJob,
        swipeOverlayOpen,
        setSwipeOverlayOpen,
    } = useResumeStore();

    const resumeData = useResumeStore((state) => state.resumeData);

    const [isLoadingJobs, setIsLoadingJobs] = useState(false);
    const [jobError, setJobError] = useState<string | null>(null);
    const [activeJob, setActiveJob] = useState<JobPosting | null>(null);
    const [isApplyAllMode, setIsApplyAllMode] = useState(false);
    const [applicationFields, setApplicationFields] = useState<Record<string, string>>({});
    const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
    const [applyAllSummary, setApplyAllSummary] = useState<string | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const visibleJobs = useMemo(
        () => jobMatches.filter((job) => !dismissedJobIds.includes(job.id)).slice(0, 10),
        [jobMatches, dismissedJobIds]
    );

    useEffect(() => {
        if (rawResumeText && jobMatches.length === 0) {
            fetchJobs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawResumeText]);

    const fetchJobs = async (overrideFilters?: Partial<JobFilters>) => {
        if (!apiUrl || !rawResumeText) {
            setJobError('API configuration missing.');
            return;
        }

        setIsLoadingJobs(true);
        setJobError(null);
        const mergedFilters = { ...jobFilters, ...overrideFilters };
        setJobFilters(mergedFilters);

        const payload = {
            resume_text: rawResumeText,
            limit: 10,
            filters: {
                keywords: mergedFilters.keywords?.trim() || undefined,
                location: mergedFilters.location?.trim() || undefined,
                distance_km: mergedFilters.distanceKm,
                employment_type: mergedFilters.employmentType && mergedFilters.employmentType !== 'any'
                    ? mergedFilters.employmentType
                    : undefined,
            },
        };

        try {
            const response = await fetch(`${apiUrl}/api/v1/jobs/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to fetch jobs.');
            }

            const data: JobSearchResponse = await response.json();
            setJobMatches(data.jobs);
        } catch (error) {
            setJobError(error instanceof Error ? error.message : 'Failed to fetch jobs.');
        } finally {
            setIsLoadingJobs(false);
        }
    };

    const openApplicationModal = (job: JobPosting, applyAll = false) => {
        setActiveJob(job);
        setIsApplyAllMode(applyAll);
        setApplicationStatus(null);
        setApplyAllSummary(null);
        const initialFields: Record<string, string> = {};
        (job.required_fields || []).forEach((field) => {
            if (field === 'portfolio_link' && resumeData?.portfolio_url) {
                initialFields[field] = resumeData.portfolio_url;
            }
            if (field === 'availability' && resumeData?.summary) {
                initialFields[field] = 'Available in 30 days';
            }
        });
        setApplicationFields(initialFields);
    };

    const closeModal = () => {
        setActiveJob(null);
        setApplicationFields({});
        setApplicationStatus(null);
        setApplyAllSummary(null);
        setIsApplyAllMode(false);
    };

    const handleFieldChange = (field: string, value: string) => {
        setApplicationFields((prev) => ({ ...prev, [field]: value }));
    };

    const handleApply = async () => {
        if (!apiUrl || !rawResumeText || !activeJob) return;
        setApplicationStatus('Submitting...');

        const response = await fetch(`${apiUrl}/api/v1/jobs/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                job_id: activeJob.id,
                job_title: activeJob.title,
                company: activeJob.company,
                apply_url: activeJob.url,
                resume_text: rawResumeText,
                required_fields: activeJob.required_fields || [],
                provided_fields: applicationFields,
            }),
        });

        const data = await response.json();
        if (data.status === 'submitted') {
            setApplicationStatus(`Applied to ${activeJob.title} at ${activeJob.company}.`);
            markJobApplied(activeJob.id);
            setTimeout(closeModal, 1500);
        } else if (data.missing_fields?.length) {
            setApplicationStatus(`Still need: ${data.missing_fields.join(', ')}`);
        } else {
            setApplicationStatus('Unable to submit right now.');
        }
    };

    const openApplyAllModal = () => {
        if (visibleJobs.length === 0) return;
        setActiveJob({
            ...visibleJobs[0],
            title: 'Apply to all matches',
            company: `${visibleJobs.length} roles`,
        });
        setIsApplyAllMode(true);

        const allRequired = new Set<string>();
        visibleJobs.forEach((job) => {
            (job.required_fields || []).forEach((field) => allRequired.add(field));
        });

        const initialFields: Record<string, string> = {};
        allRequired.forEach((field) => {
            if (field === 'portfolio_link' && resumeData?.portfolio_url) {
                initialFields[field] = resumeData.portfolio_url;
            }
        });

        setApplicationFields(initialFields);
    };

    const handleApplyAll = async () => {
        if (!apiUrl || !rawResumeText || visibleJobs.length === 0) return;
        setApplyAllSummary('Submitting applications...');

        const payload = {
            resume_text: rawResumeText,
            jobs: visibleJobs.map((job) => ({
                job_id: job.id,
                job_title: job.title,
                company: job.company,
                apply_url: job.url,
                required_fields: job.required_fields || [],
                provided_fields: applicationFields,
            })),
        };

        const response = await fetch(`${apiUrl}/api/v1/jobs/apply-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        const successes = data.filter((item: any) => item.status === 'submitted');
        const needsInfo = data.filter((item: any) => item.status === 'needs_more_info');

        successes.forEach((item: any) => markJobApplied(item.job_id));

        setApplyAllSummary(
            `Applied to ${successes.length} jobs. ${needsInfo.length ? `${needsInfo.length} need more info.` : 'All set!'}`
        );
        if (!needsInfo.length) {
            setTimeout(closeModal, 1500);
        }
    };

    const renderJobCard = (job: JobPosting) => {
        const isBookmarked = bookmarkedJobIds.includes(job.id);
        const isApplied = appliedJobIds.includes(job.id);
        const similarityPercent = job.similarity_score ? Math.round(job.similarity_score * 100) : null;

        return (
            <div key={job.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col gap-4 border border-transparent hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-dark dark:text-light">{job.title}</h3>
                        <p className="text-stone-500">{job.company}</p>
                        {job.location && (
                            <p className="text-sm flex items-center gap-1 text-stone-500 mt-1">
                                <MapPin size={14} /> {job.location}
                            </p>
                        )}
                    </div>
                    {similarityPercent !== null && (
                        <span className="text-sm font-semibold text-primary bg-primary/10 rounded-full px-3 py-1">
                            {similarityPercent}% match
                        </span>
                    )}
                </div>
                {job.salary && <p className="text-sm text-green-600 dark:text-green-400">Salary: {job.salary}</p>}
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-4">{job.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-stone-500">
                    <span className="flex items-center gap-1"><Briefcase size={14} /> {job.source}</span>
                    {job.posted_at && <span>Posted: {new Date(job.posted_at).toLocaleDateString()}</span>}
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                    <button
                        onClick={() => openApplicationModal(job)}
                        className="flex-1 bg-primary text-white rounded-full py-2 px-4 text-sm font-semibold flex items-center justify-center gap-2"
                    >
                        <Sparkles size={16} />
                        {isApplied ? 'Applied' : 'Quick Apply'}
                    </button>
                    <button
                        onClick={() => window.open(job.url, '_blank')}
                        className="flex-1 border border-stone-300 dark:border-stone-700 rounded-full py-2 px-4 text-sm flex items-center justify-center gap-2"
                    >
                        <ExternalLink size={16} />
                        View Posting
                    </button>
                </div>
                <div className="flex items-center justify-between pt-2">
                    <button
                        onClick={() => toggleBookmark(job)}
                        className={`flex items-center gap-2 text-sm ${isBookmarked ? 'text-primary' : 'text-stone-500'}`}
                    >
                        {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        {isBookmarked ? 'Saved' : 'Bookmark'}
                    </button>
                    <button
                        onClick={() => dismissJob(job.id)}
                        className="flex items-center gap-2 text-sm text-stone-400 hover:text-red-500 transition-colors"
                    >
                        <X size={16} />
                        Not Interested
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md">
                <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-dark dark:text-light">Personalized Job Matches</h2>
                        <p className="text-sm text-stone-500">We analyze your resume to curate the top roles for you.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setSwipeOverlayOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200 font-medium"
                        >
                            <Heart size={16} />
                            Start Swipe Mode
                        </button>
                        <button
                            onClick={() => fetchJobs()}
                            className="flex items-center gap-2 px-4 py-2 rounded-full border border-stone-300 dark:border-stone-700 text-sm"
                        >
                            <RotateCcw size={14} />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-full px-4 py-2">
                        <Search size={16} className="text-stone-400" />
                        <input
                            type="text"
                            placeholder="Keywords (e.g., Product Manager)"
                            value={jobFilters.keywords || ''}
                            onChange={(e) => setJobFilters({ keywords: e.target.value })}
                            className="bg-transparent flex-1 outline-none text-sm"
                        />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-full px-4 py-2">
                        <MapPin size={16} className="text-stone-400" />
                        <input
                            type="text"
                            placeholder="Preferred location"
                            value={jobFilters.location || ''}
                            onChange={(e) => setJobFilters({ location: e.target.value })}
                            className="bg-transparent flex-1 outline-none text-sm"
                        />
                    </div>
                    <select
                        value={jobFilters.employmentType || 'any'}
                        onChange={(e) => setJobFilters({ employmentType: e.target.value })}
                        className="bg-gray-50 dark:bg-gray-800 rounded-full px-4 py-2 text-sm outline-none"
                    >
                        <option value="any">Any type</option>
                        <option value="fulltime">Full-time</option>
                        <option value="parttime">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="intern">Internship</option>
                    </select>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                    <label className="flex items-center gap-2 text-sm text-stone-500">
                        <Sliders size={14} />
                        Radius: {jobFilters.distanceKm ?? 50} km
                        <input
                            type="range"
                            min={5}
                            max={100}
                            value={jobFilters.distanceKm ?? 50}
                            onChange={(e) => setJobFilters({ distanceKm: Number(e.target.value) })}
                            className="ml-2"
                        />
                    </label>
                    <button
                        onClick={() => fetchJobs()}
                        className="px-4 py-2 rounded-full bg-primary text-white text-sm flex items-center gap-2"
                    >
                        <Filter size={14} />
                        Search Again
                    </button>
                </div>
            </div>

            {jobError && (
                <div className="bg-red-100 text-red-700 p-4 rounded-xl">
                    {jobError}
                </div>
            )}

            {isLoadingJobs ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-stone-500 mt-4">Finding the best jobs for you...</p>
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-stone-500">{visibleJobs.length} jobs tailored for you</p>
                        <button
                            onClick={openApplyAllModal}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-medium"
                            disabled={visibleJobs.length === 0}
                        >
                            <Wand2 size={16} />
                            Apply to All
                        </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {visibleJobs.map((job) => renderJobCard(job))}
                    </div>
                    {visibleJobs.length === 0 && (
                        <div className="text-center text-stone-500 py-10">
                            No jobs match your preferences right now. Try adjusting the filters.
                        </div>
                    )}
                </>
            )}

            {activeJob && (
                <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center px-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-semibold text-dark dark:text-light">{activeJob.title}</h3>
                                <p className="text-sm text-stone-500">{activeJob.company}</p>
                            </div>
                            <button onClick={closeModal} className="text-stone-400 hover:text-stone-200">
                                <X />
                            </button>
                        </div>
                        <p className="text-sm text-stone-500">
                            {isApplyAllMode ? 'Provide shared details to apply to all matched jobs.' : 'We pre-filled what we could. Complete the missing fields and we’ll auto-apply for you.'}
                        </p>
                        {(isApplyAllMode
                            ? Array.from(new Set(visibleJobs.flatMap((job) => job.required_fields || [])))
                            : (activeJob.required_fields || [])
                        ).map((field) => (
                            <div key={field} className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-dark dark:text-light">{fieldLabels[field] || field}</label>
                                {field === 'cover_letter' ? (
                                    <textarea
                                        value={applicationFields[field] || ''}
                                        onChange={(e) => handleFieldChange(field, e.target.value)}
                                        placeholder={getFieldPlaceholder(field)}
                                        className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm"
                                        rows={4}
                                    />
                                ) : (
                                    <input
                                        value={applicationFields[field] || ''}
                                        onChange={(e) => handleFieldChange(field, e.target.value)}
                                        placeholder={getFieldPlaceholder(field)}
                                        className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm"
                                    />
                                )}
                            </div>
                        ))}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={isApplyAllMode ? handleApplyAll : handleApply}
                                className="flex-1 bg-primary text-white rounded-full py-3 flex items-center gap-2 justify-center"
                            >
                                <Check />
                                {isApplyAllMode ? 'Confirm Apply All' : 'Submit Application'}
                            </button>
                            <button
                                onClick={closeModal}
                                className="flex-1 border border-stone-300 dark:border-stone-700 rounded-full py-3"
                            >
                                Cancel
                            </button>
                        </div>
                        {(applicationStatus || applyAllSummary) && (
                            <p className="text-sm text-center text-stone-500">
                                {applicationStatus || applyAllSummary}
                            </p>
                        )}
                    </div>
                </div>
            )}

            <SwipeOverlay
                jobs={visibleJobs}
                isOpen={swipeOverlayOpen}
                onClose={() => setSwipeOverlayOpen(false)}
                onApply={(job) => openApplicationModal(job)}
                onBookmark={(job) => toggleBookmark(job)}
                onDismiss={(job) => dismissJob(job.id)}
            />
        </div>
    );
};

export default JobsTab;

