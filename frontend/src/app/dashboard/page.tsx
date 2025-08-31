'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useResumeStore, Project } from '@/app/store/resumeStore'; // Using alias path for robustness
import { User, Briefcase, GraduationCap, Code, Star, Github, Linkedin, Mail, Phone, ExternalLink, Loader2, FileText, CheckCircle, XCircle, BarChart, BookUser } from 'lucide-react';

// Define the type for the ATS analysis result
type ATSAnalysisResult = {
    match_score: number;
    matching_keywords: string[];
    missing_keywords: string[];
    summary: string;
};

export default function DashboardPage() {
    const router = useRouter();
    const resumeData = useResumeStore((state) => state.resumeData);
    const rawResumeText = useResumeStore((state) => state.rawResumeText);

    // State for the active tab
    const [activeTab, setActiveTab] = useState<'resume' | 'ats'>('resume');

    // State for the ATS feature
    const [atsInputType, setAtsInputType] = useState<'level' | 'description'>('level');
    const [jobDescription, setJobDescription] = useState('');
    const [atsResult, setAtsResult] = useState<ATSAnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (!resumeData) {
            router.push('/');
        }
    }, [resumeData, router]);

    // Helper function to ensure links are absolute
    const ensureAbsoluteUrl = (url: string | null | undefined): string => {
        if (!url) return '#';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return `https://${url}`;
    };

    const handleAnalysisRequest = async (payload: { job_description: string } | { career_level: string }) => {
        setIsAnalyzing(true);
        setAtsResult(null);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl || !rawResumeText) {
            alert("Configuration error or missing resume text.");
            setIsAnalyzing(false);
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api/v1/resumes/analyze-ats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resume_text: rawResumeText,
                    ...payload,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to get ATS analysis.');
            }

            const result = await response.json();
            setAtsResult(result);

        } catch (error) {
            console.error('Error during ATS analysis:', error);
            alert(`Analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!resumeData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-600 dark:text-gray-300">Loading resume data or redirecting...</p>
            </div>
        );
    }

    const renderResumeDetails = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            <aside className="lg:col-span-1 lg:sticky lg:top-8 self-start space-y-8">
                {/* Personal Details & Skills sections */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                    <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4 flex items-center">
                        <User className="mr-3 text-primary" /> Personal Details
                    </h2>
                    <div className="space-y-3 text-stone-600 dark:text-stone-300">
                        {resumeData.full_name && <p className="flex items-center"><User className="mr-2 h-4 w-4 flex-shrink-0" />{resumeData.full_name}</p>}
                        {resumeData.email && <p className="flex items-center break-all"><Mail className="mr-2 h-4 w-4 flex-shrink-0" />{resumeData.email}</p>}
                        {resumeData.phone_number && <p className="flex items-center"><Phone className="mr-2 h-4 w-4 flex-shrink-0" />{resumeData.phone_number}</p>}
                        {resumeData.linkedin_url && (
                            <a href={ensureAbsoluteUrl(resumeData.linkedin_url)} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors break-all">
                                <Linkedin className="mr-2 h-4 w-4 flex-shrink-0" />{resumeData.linkedin_url}
                            </a>
                        )}
                        {resumeData.github_url && (
                            <a href={ensureAbsoluteUrl(resumeData.github_url)} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors break-all">
                                <Github className="mr-2 h-4 w-4 flex-shrink-0" />{resumeData.github_url}
                            </a>
                        )}
                    </div>
                </div>
                {resumeData.skills && resumeData.skills.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                        <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {resumeData.skills.map((skill, index) => (
                                <span key={index} className="bg-primary/[0.1] text-primary font-medium px-3 py-1 rounded-full text-sm">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </aside>
            <main className="lg:col-span-2 space-y-8">
                {/* Summary, Work Experience, Projects, etc. */}
                {resumeData.summary && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                        <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4">Summary</h2>
                        <p className="text-stone-500">{resumeData.summary}</p>
                    </div>
                )}
                {resumeData.work_experience && resumeData.work_experience.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                        <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4 flex items-center">
                            <Briefcase className="mr-3 text-primary" /> Work Experience
                        </h2>
                        <div className="space-y-4">
                            {resumeData.work_experience.map((job, index) => (
                                job && <div key={index}>
                                    <h3 className="text-lg font-semibold">{job.job_title}</h3>
                                    <p className="text-md text-stone-600 dark:text-stone-300">{job.company} {job.location && `| ${job.location}`}</p>
                                    <p className="text-sm text-stone-500">{job.start_date} - {job.end_date || 'Present'}</p>
                                    <ul className="list-disc list-inside mt-2 text-stone-500">
                                        {job.description?.map((desc, i) => <li key={i}>{desc}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {resumeData.projects && resumeData.projects.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                        <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4 flex items-center">
                            <Code className="mr-3 text-primary" /> Projects
                        </h2>
                        <div className="space-y-4">
                            {resumeData.projects.map((project, index) => (
                            project && <div key={index}>
                                    {project.name && <h3 className="text-lg font-semibold">{project.name}</h3>}
                                    <ul className="list-disc list-inside mt-2 text-stone-500">
                                        {project.description?.map((desc, i) => <li key={i}>{desc}</li>)}
                                    </ul>
                                    {project.url && (
                                        <a href={ensureAbsoluteUrl(project.url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-2 inline-flex items-center">
                                            View Project <ExternalLink className="ml-2 h-4 w-4" />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {resumeData.education && resumeData.education.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                        <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4 flex items-center">
                            <GraduationCap className="mr-3 text-primary" /> Education
                        </h2>
                        <div className="space-y-4">
                            {resumeData.education.map((edu, index) => (
                                edu && <div key={index}>
                                    <h3 className="text-lg font-semibold">{edu.degree}</h3>
                                    <p className="text-md text-stone-600 dark:text-stone-300">{edu.institution} {edu.location && `| ${edu.location}`}</p>
                                    <p className="text-sm text-stone-500">{edu.graduation_date}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {resumeData.achievements && resumeData.achievements.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                        <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4 flex items-center">
                            <Star className="mr-3 text-primary" /> Achievements
                        </h2>
                        <ul className="list-disc list-inside text-stone-500 space-y-2">
                            {resumeData.achievements.map((ach, index) => <li key={index}>{ach}</li>)}
                        </ul>
                    </div>
                )}
            </main>
        </div>
    );

    const renderAtsChecker = () => (
        <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
            <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4 flex items-center">
                <FileText className="mr-3 text-primary" /> ATS Score Checker
            </h2>
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1 mb-4 w-fit bg-gray-50 dark:bg-gray-900">
                <button onClick={() => setAtsInputType('level')} className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${atsInputType === 'level' ? 'bg-primary text-white shadow' : 'text-stone-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    By Career Level
                </button>
                    <button onClick={() => setAtsInputType('description')} className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${atsInputType === 'description' ? 'bg-primary text-white shadow' : 'text-stone-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    By Job Description
                </button>
            </div>
            {atsInputType === 'level' && (
                <div>
                    <p className="text-stone-500 mb-4">Select a career level to get a general score.</p>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => handleAnalysisRequest({ career_level: 'Entry Level' })} disabled={isAnalyzing} className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-dark dark:text-light font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50">Entry Level</button>
                        <button onClick={() => handleAnalysisRequest({ career_level: 'Mid Level' })} disabled={isAnalyzing} className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-dark dark:text-light font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50">Mid Level</button>
                        <button onClick={() => handleAnalysisRequest({ career_level: 'Senior Level' })} disabled={isAnalyzing} className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-dark dark:text-light font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50">Senior Level</button>
                    </div>
                </div>
            )}
            {atsInputType === 'description' && (
                <div>
                    <p className="text-stone-500 mb-4">Paste a job description for a specific analysis.</p>
                        <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the full job description here..."
                        className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                    />
                    <button
                        onClick={() => handleAnalysisRequest({ job_description: jobDescription })}
                        disabled={isAnalyzing || !jobDescription.trim()}
                        className="mt-4 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/[0.9] transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Analyze
                    </button>
                </div>
            )}
            {isAnalyzing && (
                    <div className="flex items-center justify-center mt-6">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
                    <span className="text-stone-500">Analyzing, please wait...</span>
                </div>
            )}
            {atsResult && (
                <div className="mt-6">
                    <h3 className="text-xl font-semibold text-dark dark:text-light mb-4">Analysis Result</h3>
                    <div className="mb-4">
                        <p className="text-lg font-medium text-stone-600 dark:text-stone-300">Overall Match Score:</p>
                        <div className="text-4xl font-bold text-primary">{atsResult.match_score}<span className="text-2xl">%</span></div>
                    </div>
                    <div className="mb-4">
                        <h4 className="text-lg font-medium text-stone-600 dark:text-stone-300 mb-2 flex items-center"><CheckCircle className="mr-2 text-green-500"/>Matching Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                            {atsResult.matching_keywords.map((kw, i) => <span key={i} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium px-2.5 py-0.5 rounded-full">{kw}</span>)}
                        </div>
                    </div>
                    <div className="mb-4">
                        <h4 className="text-lg font-medium text-stone-600 dark:text-stone-300 mb-2 flex items-center"><XCircle className="mr-2 text-red-500"/>Missing Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                            {atsResult.missing_keywords.map((kw, i) => <span key={i} className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm font-medium px-2.5 py-0.5 rounded-full">{kw}</span>)}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-lg font-medium text-stone-600 dark:text-stone-300 mb-2">AI Summary</h4>
                        <p className="text-stone-500 dark:text-stone-400">{atsResult.summary}</p>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-light dark:bg-dark min-h-screen font-secondary">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('resume')}
                            className={`${
                                activeTab === 'resume'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:border-gray-300 dark:hover:border-gray-600'
                            } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}
                        >
                            <BookUser className="mr-2 h-5 w-5" /> Resume Details
                        </button>
                        <button
                            onClick={() => setActiveTab('ats')}
                            className={`${
                                activeTab === 'ats'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:border-gray-300 dark:hover:border-gray-600'
                            } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}
                        >
                           <BarChart className="mr-2 h-5 w-5" /> ATS Checker
                        </button>
                    </nav>
                </div>

                {/* Conditional Content */}
                <div>
                    {activeTab === 'resume' && renderResumeDetails()}
                    {activeTab === 'ats' && renderAtsChecker()}
                </div>
            </div>
        </div>
    );
}

