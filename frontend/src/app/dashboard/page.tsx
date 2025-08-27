// frontend\src\app\dashboard\page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResumeStore } from '../store/resumeStore';
// Removed unused icons: Mail, Phone, Linkedin
import { User, Briefcase, GraduationCap, Lightbulb } from 'lucide-react';

export default function DashboardPage() {
  const { resumeData } = useResumeStore();
  const router = useRouter();

  useEffect(() => {
    if (!resumeData) {
      router.push('/');
    }
  }, [resumeData, router]);

  if (!resumeData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-light dark:bg-dark text-dark dark:text-light">
        <p>Loading resume data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light dark:bg-dark text-dark dark:text-light font-secondary p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-10">
          <h1 className="font-primary text-4xl sm:text-5xl md:text-6xl text-primary mb-2">Resume Analysis</h1>
          {/* Corrected the unescaped apostrophe */}
          <p className="text-stone-500">Here&apos;s what our AI extracted from your resume.</p>
        </div>

        <div className="bg-white/[0.05] p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-primary mb-6 flex items-center"><User className="mr-3 text-primary" /> Personal Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-lg">
            <p><strong>Full Name:</strong> {resumeData.full_name || 'N/A'}</p>
            <p><strong>Email:</strong> {resumeData.email || 'N/A'}</p>
            <p><strong>Phone:</strong> {resumeData.phone_number || 'N/A'}</p>
            <p><strong>LinkedIn:</strong> {resumeData.linkedin_url ? <a href={`//${resumeData.linkedin_url}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{resumeData.linkedin_url}</a> : 'N/A'}</p>
          </div>
        </div>

        <div className="bg-white/[0.05] p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-primary mb-4 flex items-center"><Lightbulb className="mr-3 text-primary" /> Skills</h2>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills && resumeData.skills.length > 0 ? (
              resumeData.skills.map((skill, index) => (
                <span key={index} className="bg-primary/20 text-primary text-sm font-medium px-3 py-1 rounded-full">
                  {skill}
                </span>
              ))
            ) : (
              <p>No skills found.</p>
            )}
          </div>
        </div>

        <div className="bg-white/[0.05] p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-primary mb-6 flex items-center"><Briefcase className="mr-3 text-primary" /> Work Experience</h2>
          <div className="space-y-6">
            {resumeData.work_experience && resumeData.work_experience.length > 0 ? (
              resumeData.work_experience.map((job, index) => (
                <div key={index} className="border-l-2 border-primary pl-4">
                  <h3 className="text-xl font-bold">{job.job_title || 'N/A'}</h3>
                  <p className="font-medium text-stone-400">{job.company || 'N/A'} - {job.location || 'N/A'}</p>
                  <p className="text-sm text-stone-500 mb-2">{job.start_date || ''} - {job.end_date || 'Present'}</p>
                  <ul className="list-disc list-inside text-stone-300 space-y-1">
                    {job.description?.map((desc, i) => <li key={i}>{desc}</li>)}
                  </ul>
                </div>
              ))
            ) : (
              <p>No work experience found.</p>
            )}
          </div>
        </div>

        <div className="bg-white/[0.05] p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-primary mb-6 flex items-center"><GraduationCap className="mr-3 text-primary" /> Education</h2>
          <div className="space-y-4">
            {resumeData.education && resumeData.education.length > 0 ? (
              resumeData.education.map((edu, index) => (
                <div key={index}>
                  <h3 className="text-xl font-bold">{edu.degree || 'N/A'}</h3>
                  <p className="font-medium text-stone-400">{edu.institution || 'N/A'} - {edu.location || 'N/A'}</p>
                  <p className="text-sm text-stone-500">{edu.graduation_date || 'N/A'}</p>
                </div>
              ))
            ) : (
              <p>No education details found.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}