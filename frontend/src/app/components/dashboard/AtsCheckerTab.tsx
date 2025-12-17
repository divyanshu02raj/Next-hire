// frontend\src\app\components\dashboard\AtsCheckerTab.tsx
'use client';

import { useState } from 'react';
import { Loader2, FileText, CheckCircle, XCircle, ThumbsUp, Lightbulb, Wand2 } from 'lucide-react';

// --- Type Definitions ---
// These now match the new, more advanced backend models

interface KeywordAnalysis {
    matching_keywords: string[];
    missing_keywords: string[];
}

interface RewriteSuggestion {
    original_bullet: string;
    suggested_improvement: string;
}

interface ATSAnalysisResult {
    match_score: number;
    summary: string;
    strengths: string[];
    areas_for_improvement: string[];
    keyword_analysis: KeywordAnalysis;
    rewrite_suggestions: RewriteSuggestion[];
};

// Define the props that this component will accept
interface AtsCheckerTabProps {
    rawResumeText: string | null;
}

const AtsCheckerTab: React.FC<AtsCheckerTabProps> = ({ rawResumeText }) => {
    // State for the ATS feature UI and data
    const [atsInputType, setAtsInputType] = useState<'level' | 'description'>('level');
    const [jobDescription, setJobDescription] = useState('');
    const [atsResult, setAtsResult] = useState<ATSAnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Function to handle the API call to the backend for analysis
    const handleAnalysisRequest = async (payload: { job_description?: string; career_level?: string }) => {
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

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4 flex items-center">
                <FileText className="mr-3 text-primary" /> AI Resume Optimizer
            </h2>
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1 mb-6 w-fit bg-gray-50 dark:bg-gray-900">
                <button onClick={() => setAtsInputType('level')} className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${atsInputType === 'level' ? 'bg-primary text-white shadow' : 'text-stone-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>By Career Level</button>
                <button onClick={() => setAtsInputType('description')} className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${atsInputType === 'description' ? 'bg-primary text-white shadow' : 'text-stone-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>By Job Description</button>
            </div>
            
            {atsInputType === 'level' && (<div><p className="text-stone-500 mb-4">Select a career level for a general analysis.</p><div className="flex flex-wrap gap-3"><button onClick={() => handleAnalysisRequest({ career_level: 'Entry Level' })} disabled={isAnalyzing} className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-dark dark:text-light font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50">Entry Level</button><button onClick={() => handleAnalysisRequest({ career_level: 'Mid Level' })} disabled={isAnalyzing} className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-dark dark:text-light font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50">Mid Level</button><button onClick={() => handleAnalysisRequest({ career_level: 'Senior Level' })} disabled={isAnalyzing} className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-dark dark:text-light font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50">Senior Level</button></div></div>)}
            
            {atsInputType === 'description' && (<div><p className="text-stone-500 mb-4">Paste a job description for a specific analysis.</p><textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the full job description here..." className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-colors" /><button onClick={() => handleAnalysisRequest({ job_description: jobDescription })} disabled={isAnalyzing || !jobDescription.trim()} className="mt-4 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/[0.9] transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">Analyze</button></div>)}
            
            {isAnalyzing && (<div className="flex flex-col items-center justify-center mt-8 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-stone-500 mt-2">Our AI is analyzing your resume... this may take a moment.</p></div>)}
            
            {/* --- ENHANCED ATS RESULTS DISPLAY --- */}
            {atsResult && (
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-2xl font-bold text-dark dark:text-light mb-6 text-center">Your Detailed ATS Report</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl mb-6">
                        <div className="md:col-span-1 flex justify-center">
                            <div className="relative h-40 w-40">
                                <svg className="transform -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" fill="none" strokeWidth="12" className="stroke-gray-200 dark:stroke-gray-700" />
                                    <circle
                                        cx="60" cy="60" r="54" fill="none" strokeWidth="12"
                                        className="stroke-primary"
                                        strokeDasharray={2 * Math.PI * 54}
                                        strokeDashoffset={2 * Math.PI * 54 * (1 - atsResult.match_score / 100)}
                                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-4xl font-bold text-primary">{atsResult.match_score}<span className="text-2xl">%</span></span>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2 text-left">
                             <h4 className="text-lg font-semibold text-dark dark:text-light mb-2">AI Recruiter Summary</h4>
                             <p className="text-stone-500 dark:text-stone-400 leading-relaxed">{atsResult.summary}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <h4 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center"><ThumbsUp className="mr-2"/>Key Strengths</h4>
                            <ul className="list-disc list-inside space-y-2 text-green-700 dark:text-green-400">
                                {atsResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                            <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center"><Lightbulb className="mr-2"/>Areas for Improvement</h4>
                            <ul className="list-disc list-inside space-y-2 text-amber-700 dark:text-amber-400">
                                {atsResult.areas_for_improvement.map((a, i) => <li key={i}>{a}</li>)}
                            </ul>
                        </div>
                    </div>

                    {/* --- AI-Powered Optimization Suggestions --- */}
                    {atsResult.rewrite_suggestions && atsResult.rewrite_suggestions.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-xl font-semibold text-dark dark:text-light mb-4 flex items-center"><Wand2 className="mr-2 text-primary"/>AI-Powered Optimization Suggestions</h4>
                            <div className="space-y-4">
                                {atsResult.rewrite_suggestions.map((suggestion, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                        <div>
                                            <h5 className="font-semibold text-red-600 dark:text-red-400 mb-2">Original Bullet Point:</h5>
                                            <p className="text-sm text-stone-500 italic">&quot;{suggestion.original_bullet}&quot;</p>
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-green-600 dark:text-green-400 mb-2">Suggested Improvement:</h5>
                                            <p className="text-sm text-dark dark:text-light">{suggestion.suggested_improvement}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="text-xl font-semibold text-dark dark:text-light mb-4">Keyword Analysis</h4>
                        <div className="mb-4">
                            <h5 className="text-md font-medium text-stone-600 dark:text-stone-300 mb-2 flex items-center"><CheckCircle className="mr-2 text-green-500"/>Matching Keywords</h5>
                            <div className="flex flex-wrap gap-2">
                                {atsResult.keyword_analysis.matching_keywords.map((kw, i) => <span key={i} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium px-2.5 py-0.5 rounded-full">{kw}</span>)}
                            </div>
                        </div>
                        <div>
                            <h5 className="text-md font-medium text-stone-600 dark:text-stone-300 mb-2 flex items-center"><XCircle className="mr-2 text-red-500"/>Missing Keywords</h5>
                            <div className="flex flex-wrap gap-2">
                                {atsResult.keyword_analysis.missing_keywords.map((kw, i) => <span key={i} className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm font-medium px-2.5 py-0.5 rounded-full">{kw}</span>)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AtsCheckerTab;

