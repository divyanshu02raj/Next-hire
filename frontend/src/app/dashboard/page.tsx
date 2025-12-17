'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useResumeStore } from '@/app/store/resumeStore';
import { BarChart, BookOpen, Briefcase } from 'lucide-react';

// Import the new child components
import ResumeDetailsTab from '@/app/components/dashboard/ResumeDetailsTab';
import AtsCheckerTab from '@/app/components/dashboard/AtsCheckerTab';
import JobsTab from '@/app/components/dashboard/JobsTab';

export default function DashboardPage() {
    const router = useRouter();
    const resumeData = useResumeStore((state) => state.resumeData);
    const rawResumeText = useResumeStore((state) => state.rawResumeText);

    // State for the active tab is now the primary state managed by this page
    const [activeTab, setActiveTab] = useState<'resume' | 'ats' | 'jobs'>('resume');

    useEffect(() => {
        // If there's no resume data, redirect to the home page to upload one.
        if (!resumeData) {
            router.push('/');
        }
    }, [resumeData, router]);

    // Render a loading state while data is being checked or redirecting.
    if (!resumeData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-600 dark:text-gray-300"></p>
            </div>
        );
    }

    return (
        <div className="bg-light dark:bg-dark min-h-screen font-secondary">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

                {/* --- Tab Navigation --- */}
                <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('resume')}
                            className={`${
                                activeTab === 'resume'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-stone-500 hover:text-dark dark:hover:text-light hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors flex items-center`}
                        >
                            <BookOpen className="mr-2 h-5 w-5"/>
                            Resume Details
                        </button>
                        <button
                            onClick={() => setActiveTab('ats')}
                            className={`${
                                activeTab === 'ats'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-stone-500 hover:text-dark dark:hover:text-light hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors flex items-center`}
                        >
                            <BarChart className="mr-2 h-5 w-5"/>
                            ATS Checker
                        </button>
                        <button
                            onClick={() => setActiveTab('jobs')}
                            className={`${
                                activeTab === 'jobs'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-stone-500 hover:text-dark dark:hover:text-light hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors flex items-center`}
                        >
                            <Briefcase className="mr-2 h-5 w-5"/>
                            Jobs
                        </button>
                    </nav>
                </div>

                {/* --- Tab Content --- */}
                <div>
                    {/* --- Resume Details Tab --- */}
                    {activeTab === 'resume' && (
                        <ResumeDetailsTab resumeData={resumeData} />
                    )}

                    {/* --- ATS Checker Tab --- */}
                    {activeTab === 'ats' && (
                        <AtsCheckerTab rawResumeText={rawResumeText} />
                    )}
                    {activeTab === 'jobs' && (
                        <JobsTab />
                    )}
                </div>
            </div>
        </div>
    );
}