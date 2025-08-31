'use client';

import { useState } from 'react';
import { Loader2, FileText, CheckCircle, XCircle } from 'lucide-react';

// Define the type for the ATS analysis result
type ATSAnalysisResult = {
    match_score: number;
    matching_keywords: string[];
    missing_keywords: string[];
    summary: string;
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

    return (
        <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4 flex items-center">
                <FileText className="mr-3 text-primary" /> ATS Score Checker
            </h2>
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1 mb-4 w-fit bg-gray-50 dark:bg-gray-900">
                <button onClick={() => setAtsInputType('level')} className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${atsInputType === 'level' ? 'bg-primary text-white shadow' : 'text-stone-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>By Career Level</button>
                <button onClick={() => setAtsInputType('description')} className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${atsInputType === 'description' ? 'bg-primary text-white shadow' : 'text-stone-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>By Job Description</button>
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
                    <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the full job description here..." className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-colors" />
                    <button onClick={() => handleAnalysisRequest({ job_description: jobDescription })} disabled={isAnalyzing || !jobDescription.trim()} className="mt-4 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/[0.9] transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
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
                        <div className="flex flex-wrap gap-2">{atsResult.matching_keywords.map((kw, i) => <span key={i} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium px-2.5 py-0.5 rounded-full">{kw}</span>)}</div>
                    </div>
                    <div className="mb-4">
                        <h4 className="text-lg font-medium text-stone-600 dark:text-stone-300 mb-2 flex items-center"><XCircle className="mr-2 text-red-500"/>Missing Keywords</h4>
                        <div className="flex flex-wrap gap-2">{atsResult.missing_keywords.map((kw, i) => <span key={i} className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm font-medium px-2.5 py-0.5 rounded-full">{kw}</span>)}</div>
                    </div>
                    <div>
                        <h4 className="text-lg font-medium text-stone-600 dark:text-stone-300 mb-2">AI Summary</h4>
                        <p className="text-stone-500 dark:text-stone-400">{atsResult.summary}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AtsCheckerTab;