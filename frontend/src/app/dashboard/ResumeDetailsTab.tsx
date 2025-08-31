'use client';

import { ResumeData } from '@/app/store/resumeStore';
import { User, Briefcase, GraduationCap, Code, Star, Github, Linkedin, Mail, Phone, ExternalLink } from 'lucide-react';

// Define the props for this component
interface ResumeDetailsTabProps {
    resumeData: ResumeData;
}

// Helper function to ensure links are absolute
const ensureAbsoluteUrl = (url: string | null | undefined): string => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `https://${url}`;
};

const ResumeDetailsTab: React.FC<ResumeDetailsTabProps> = ({ resumeData }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            <aside className="lg:col-span-1 lg:sticky lg:top-8 self-start space-y-8">
                {/* Personal Details Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                    <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4 flex items-center"><User className="mr-3 text-primary" /> Personal Details</h2>
                    <div className="space-y-3 text-stone-600 dark:text-stone-300">
                        {resumeData.full_name && <p className="flex items-center"><User className="mr-2 h-4 w-4 flex-shrink-0" />{resumeData.full_name}</p>}
                        {resumeData.email && <p className="flex items-center break-all"><Mail className="mr-2 h-4 w-4 flex-shrink-0" />{resumeData.email}</p>}
                        {resumeData.phone_number && <p className="flex items-center"><Phone className="mr-2 h-4 w-4 flex-shrink-0" />{resumeData.phone_number}</p>}
                        {resumeData.linkedin_url && <a href={ensureAbsoluteUrl(resumeData.linkedin_url)} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors break-all"><Linkedin className="mr-2 h-4 w-4 flex-shrink-0" />{resumeData.linkedin_url}</a>}
                        {resumeData.github_url && <a href={ensureAbsoluteUrl(resumeData.github_url)} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors break-all"><Github className="mr-2 h-4 w-4 flex-shrink-0" />{resumeData.github_url}</a>}
                    </div>
                </div>

                {/* Skills Section */}
                {resumeData.skills && resumeData.skills.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                        <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {resumeData.skills.map((skill, index) => <span key={index} className="bg-primary/[0.1] text-primary font-medium px-3 py-1 rounded-full text-sm">{skill}</span>)}
                        </div>
                    </div>
                )}
            </aside>

            <main className="lg:col-span-2 space-y-8">
                {/* Summary, Work Experience, Projects, etc. */}
                {resumeData.summary && <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md"><h2 className="text-2xl font-semibold text-dark dark:text-light mb-4">Summary</h2><p className="text-stone-500">{resumeData.summary}</p></div>}
                
                {resumeData.work_experience && resumeData.work_experience.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                        <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4 flex items-center"><Briefcase className="mr-3 text-primary" /> Work Experience</h2>
                        <div className="space-y-6">
                            {resumeData.work_experience.map((job, index) => (
                                job && <div key={index} className="border-t border-gray-200 dark:border-gray-700 pt-6 first:pt-0 first:border-none">
                                    <h3 className="text-lg font-semibold text-dark dark:text-light">{job.job_title}</h3>
                                    <p className="text-md text-stone-600 dark:text-stone-300">{job.company} {job.location && `| ${job.location}`}</p>
                                    <p className="text-sm text-stone-500">{job.start_date} - {job.end_date || 'Present'}</p>
                                    {job.description && job.description.length > 0 && (
                                        <ul className="list-disc list-inside mt-2 text-stone-500 space-y-1">{job.description.map((desc, i) => <li key={i}>{desc}</li>)}</ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {resumeData.projects && resumeData.projects.length > 0 && (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4 flex items-center"><Code className="mr-3 text-primary" /> Projects</h2>
        <div className="space-y-6">
            {resumeData.projects.map((project, index) => (
                project && <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                        {project.name && <h3 className="text-lg font-semibold">{project.name}</h3>}
                        {project.url && (
                            <a href={ensureAbsoluteUrl(project.url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center text-sm font-medium">
                                View Project <ExternalLink className="ml-1.5 h-4 w-4" />
                            </a>
                        )}
                    </div>
                    
                    {/* --- MODIFIED CODE BLOCK STARTS HERE --- */}
                    {project.tech_stack && project.tech_stack.length > 0 && (
                        <div className="mt-3 flex items-center flex-wrap gap-y-2"> {/* <-- 1. Made this a flex container */}
                            <h4 className="text-sm font-semibold text-dark dark:text-light mr-2">Tech Stack:</h4> {/* <-- 2. Changed margin */}
                            <div className="flex flex-wrap gap-2">
                                {project.tech_stack.map((tech, i) => (
                                    <span key={i} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium px-2.5 py-1 rounded-full">{tech}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* --- MODIFIED CODE BLOCK ENDS HERE --- */}

                    {project.description && project.description.length > 0 && (
                        <ul className="list-disc list-inside mt-2 text-stone-500 space-y-1">
                            {project.description.map((desc, i) => <li key={i}>{desc}</li>)}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    </div>
)}
                
                {resumeData.education && resumeData.education.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                        <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4 flex items-center"><GraduationCap className="mr-3 text-primary" /> Education</h2>
                        <div className="space-y-4">
                            {resumeData.education.map((edu, index) => (
                                edu && <div key={index}>
                                    <h3 className="text-lg font-semibold text-dark dark:text-light">{edu.degree}</h3>
                                    <p className="text-md text-stone-600 dark:text-stone-300">{edu.institution} {edu.location && `| ${edu.location}`}</p>
                                    <p className="text-sm text-stone-500">{edu.graduation_date}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {resumeData.achievements && resumeData.achievements.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                        <h2 className="text-2xl font-semibold text-dark dark:text-light mb-4 flex items-center"><Star className="mr-3 text-primary" /> Achievements</h2>
                        <ul className="list-disc list-inside text-stone-500 space-y-2">
                            {resumeData.achievements.map((ach, index) => <li key={index}>{ach}</li>)}
                        </ul>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ResumeDetailsTab;