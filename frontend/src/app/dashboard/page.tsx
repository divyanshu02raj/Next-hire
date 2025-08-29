// frontend\src\app\dashboard\page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResumeStore } from '../store/resumeStore';
import { Briefcase, GraduationCap, Star, Award, User, Link as LinkIcon, Github, Linkedin, Mail, Phone } from 'lucide-react';

export default function Dashboard() {
    const router = useRouter();
    const resumeData = useResumeStore((state) => state.resumeData);

    useEffect(() => {
        // If there's no resume data in the store, redirect to the homepage.
        // This prevents users from accessing the dashboard directly.
        if (!resumeData) {
            router.push('/');
        }
    }, [resumeData, router]);

    // Helper function to ensure URLs are absolute
    const ensureAbsoluteUrl = (url: string) => {
        if (!url) return '#';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return `https://${url}`;
    };

    if (!resumeData) {
        // Render a loading state or null while redirecting
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-600 dark:text-gray-300">Loading resume data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-light dark:bg-dark text-dark dark:text-light font-secondary transition-colors duration-200">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-primary font-bold text-center text-primary">Resume Analysis</h1>
                    <p className="text-center text-stone-500 mt-2">Here is what our AI extracted from your resume.</p>
                </header>

                <div className="space-y-8">

                    {/* Personal Details Section */}
                    <div className="p-6 bg-white/[0.05] rounded-xl shadow-sm">
                        <h2 className="text-2xl font-bold font-primary mb-4 flex items-center">
                            <User className="mr-3 text-primary" /> Personal Details
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-stone-400">
                            {resumeData.full_name && (
                                <div className="flex items-center">
                                    <User className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                                    <span>{resumeData.full_name}</span>
                                </div>
                            )}
                            {resumeData.email && (
                                <div className="flex items-center">
                                    <Mail className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                                    <a href={`mailto:${resumeData.email}`} className="hover:text-primary truncate">{resumeData.email}</a>
                                </div>
                            )}
                            {resumeData.phone_number && (
                                <div className="flex items-center">
                                    <Phone className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                                    <span>{resumeData.phone_number}</span>
                                </div>
                            )}
                             {resumeData.github_url && (
                                <div className="flex items-center">
                                    <Github className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                                    <a href={ensureAbsoluteUrl(resumeData.github_url)} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">
                                        {resumeData.github_url}
                                    </a>
                                </div>
                            )}
                            {resumeData.linkedin_url && (
                                <div className="flex items-center">
                                    <Linkedin className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                                    <a href={ensureAbsoluteUrl(resumeData.linkedin_url)} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">
                                        {resumeData.linkedin_url}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary Section */}
                    {resumeData.summary && (
                        <div className="p-6 bg-white/[0.05] rounded-xl shadow-sm">
                            <h2 className="text-2xl font-bold font-primary mb-4 flex items-center"><User className="mr-3 text-primary" /> Summary</h2>
                            <p className="text-stone-400 whitespace-pre-wrap">{resumeData.summary}</p>
                        </div>
                    )}

                    {/* Skills Section */}
                    {resumeData.skills && resumeData.skills.length > 0 && (
                        <div className="p-6 bg-white/[0.05] rounded-xl shadow-sm">
                            <h2 className="text-2xl font-bold font-primary mb-4 flex items-center"><Star className="mr-3 text-primary" /> Skills</h2>
                            <div className="flex flex-wrap gap-2">
                                {resumeData.skills.map((skill, index) => (
                                    <span key={index} className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Work Experience Section */}
                    {resumeData.work_experience && resumeData.work_experience.length > 0 && (
                        <div className="p-6 bg-white/[0.05] rounded-xl shadow-sm">
                            <h2 className="text-2xl font-bold font-primary mb-4 flex items-center"><Briefcase className="mr-3 text-primary" /> Work Experience</h2>
                            <div className="space-y-6">
                                {resumeData.work_experience.map((job, index) => (
                                    <div key={index} className="border-l-2 border-primary/30 pl-4">
                                        {job.job_title && <h3 className="text-lg font-semibold">{job.job_title}</h3>}
                                        <p className="text-md text-stone-400">{job.company} {job.location && ` - ${job.location}`}</p>
                                        <p className="text-sm text-stone-500">{job.start_date} - {job.end_date || 'Present'}</p>
                                        {job.description && (
                                            <ul className="list-disc list-inside mt-2 text-stone-400 space-y-1">
                                                {job.description.map((desc, i) => <li key={i}>{desc}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                     {/* Projects Section */}
                     {resumeData.projects && resumeData.projects.length > 0 && (
                        <div className="p-6 bg-white/[0.05] rounded-xl shadow-sm">
                            <h2 className="text-2xl font-bold font-primary mb-4 flex items-center"><Github className="mr-3 text-primary" /> Projects</h2>
                            <div className="space-y-6">
                                {resumeData.projects.map((project, index) => (
                                    <div key={index} className="border-l-2 border-primary/30 pl-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                {project.name && <h3 className="text-lg font-semibold">{project.name}</h3>}
                                                {project.technologies && project.technologies.length > 0 && (
                                                     <p className="text-sm text-stone-500 mb-2">{project.technologies.join(', ')}</p>
                                                )}
                                            </div>
                                            {project.url && (
                                                 <a href={ensureAbsoluteUrl(project.url)} target="_blank" rel="noopener noreferrer" className="text-sm bg-primary/10 text-primary font-medium px-3 py-1 rounded-full hover:bg-primary/20 transition-colors whitespace-nowrap">
                                                     View Project
                                                 </a>
                                            )}
                                        </div>
                                        {project.description && (
                                            <ul className="list-disc list-inside mt-2 text-stone-400 space-y-1">
                                                {project.description.map((desc, i) => <li key={i}>{desc}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Education Section */}
                    {resumeData.education && resumeData.education.length > 0 && (
                        <div className="p-6 bg-white/[0.05] rounded-xl shadow-sm">
                            <h2 className="text-2xl font-bold font-primary mb-4 flex items-center"><GraduationCap className="mr-3 text-primary" /> Education</h2>
                            <div className="space-y-4">
                                {resumeData.education.map((edu, index) => (
                                    <div key={index} className="border-l-2 border-primary/30 pl-4">
                                        {edu.degree && <h3 className="text-lg font-semibold">{edu.degree}</h3>}
                                        <p className="text-md text-stone-400">{edu.institution} {edu.location && `- ${edu.location}`}</p>
                                        <p className="text-sm text-stone-500">{edu.graduation_date}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Achievements Section */}
                    {resumeData.achievements && resumeData.achievements.length > 0 && (
                        <div className="p-6 bg-white/[0.05] rounded-xl shadow-sm">
                            <h2 className="text-2xl font-bold font-primary mb-4 flex items-center"><Award className="mr-3 text-primary" /> Achievements</h2>
                            <ul className="list-disc list-inside text-stone-400 space-y-1">
                                {resumeData.achievements.map((achievement, index) => (
                                    <li key={index}>{achievement}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

