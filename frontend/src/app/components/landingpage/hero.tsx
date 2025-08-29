// frontend\src\app\components\landingpage\hero.tsx
'use client';

import { Bookmark, Sun, Moon, Loader2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useResumeStore } from '../../store/resumeStore'; // Corrected import path

// This component is the main interactive element of the landing page.
export default function Hero() {
    // State Management
    const [isDark, setIsDark] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const setResumeData = useResumeStore((state) => state.setResumeData);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Effect to set the initial theme based on system preference
    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    // Function to toggle between light and dark mode
    const toggleTheme = () => {
        const html = document.documentElement;
        html.classList.toggle('dark');
        setIsDark(!isDark);
    };

    // Triggers the hidden file input when the main button is clicked
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    // The core logic for handling file selection, parsing, and API calls
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);

        try {
            let extractedText = '';

            if (file.type === 'application/pdf') {
                // Dynamically import the PDF parsing library
                const pdfjs = await import('pdfjs-dist/build/pdf');
                const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
                pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

                const data = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument(data).promise;
                const numPages = pdf.numPages;
                let textContentStr = '';
                const allUrls: string[] = [];
                
                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    // Get text content
                    const textContent = await page.getTextContent();
                    textContentStr += textContent.items.map((item: any) => item.str).join(' ');

                    // Get link annotations
                    const annotations = await page.getAnnotations();
                    annotations
                        .filter((annotation: any) => annotation.subtype === 'Link' && annotation.url)
                        .forEach((annotation: any) => allUrls.push(annotation.url));
                }

                extractedText = textContentStr;
                
                // Append the found URLs clearly to the text so the AI can see them
                if (allUrls.length > 0) {
                    const uniqueUrls = [...new Set(allUrls)]; // Remove duplicate URLs
                    extractedText += '\n\n--- Extracted Hyperlinks ---\n' + uniqueUrls.join('\n');
                }

            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                // Handle DOCX files, including hyperlinks
                const mammoth = (await import('mammoth')).default;
                const arrayBuffer = await file.arrayBuffer();
                
                // 1. Convert DOCX to HTML to preserve hyperlink structures
                const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

                // 2. Extract plain text for the main content
                const { value: text } = await mammoth.extractRawText({ arrayBuffer });
                extractedText = text;

                // 3. Use DOMParser to find all hyperlinks in the generated HTML
                if (typeof window !== 'undefined') {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const links = Array.from(doc.querySelectorAll('a'));
                    const extractedUrls = links.map(link => link.href).filter(href => href);

                    // 4. Append the found URLs clearly to the text so the AI can see them
                    if (extractedUrls.length > 0) {
                        extractedText += '\n\n--- Extracted Hyperlinks ---\n' + extractedUrls.join('\n');
                    }
                }

            } else {
                alert('Unsupported file type. Please upload a PDF or DOCX file.');
                setIsLoading(false);
                return;
            }
            await callParseApi(extractedText);

        } catch (error) {
            console.error('Error parsing file:', error);
            alert('There was an error parsing your resume. Please try again.');
        } finally {
            setIsLoading(false);
            // Reset file input to allow re-uploading the same file
            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Function to send the extracted text to the backend API
    const callParseApi = async (text: string) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
            console.error("API URL is not configured. Please set NEXT_PUBLIC_API_URL in your .env.local file.");
            alert("API URL is not configured. The application cannot proceed.");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api/v1/resumes/parse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ resume_text: text }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'An unknown error occurred.');
            }

            const data = await response.json();
            console.log("API Response:", data);
            
            // Save data to the store and navigate to the dashboard
            setResumeData(data);
            router.push('/dashboard');

        } catch (error) {
            console.error('Error calling API:', error);
            alert(`Failed to analyze resume: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    return (
        <div className="relative flex flex-col items-center gap-20 justify-center pt-12 md:pt-36 h-screen w-full">
            {/* Background Grid */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    opacity: 0.09,
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 5%, transparent 100%)',
                    maskImage: 'radial-gradient(ellipse at center, black 5%, transparent 100%)',
                }}
            >
                <div className={`w-full h-full ${isDark ? 'bg-grid-white' : 'bg-grid-black'}`} />
            </div>

            {/* Main Content */}
            <div className="relative flex flex-col items-center gap-6 md:gap-8 z-10">
                <div className="flex flex-row items-center">
                    <div className="hidden px-4 py-3 rounded-full items-center md:flex text-center font-secondary text-xs md:text-l text-dark dark:text-light hover:bg-red-600 hover:text-light transition-all duration-200 ease-in-out border-2 border-red-600 bg-blur-2xl">
                        {isDark ? (
                            <Bookmark className="inline mr-2 w-3 md:w-6 h-auto" stroke="#FFFFF8" fill="#FFFFF8" />
                        ) : (
                            <Bookmark className="inline mr-2 w-3 md:w-6 h-auto" stroke="#121212" fill="#121212" />
                        )}
                        find your dream job
                    </div>
                    <button
                        className="bg-neutral-800 rounded-full p-3 ml-4 hidden md:flex items-center justify-center transition-colors duration-200"
                        onClick={toggleTheme}
                        aria-label="Toggle dark mode"
                        type="button"
                    >
                        {isDark ? (
                            <Sun className="inline" size={28} color="#FFFFF8" />
                        ) : (
                            <Moon className="inline" size={28} color="#FFFFF8" />
                        )}
                    </button>
                </div>
                <div className="font-primary text-4xl md:text-6xl uppercase px-8 text-center text-dark dark:text-light transition-colors duration-200">
                    Upload. Match. Succeed
                </div>
                <div className="font-secondary text-sm md:text-l px-8 text-center text-stone-500 md:mt-3 transition-colors duration-200">
                    AI powered job search, let AI help find perfect job roles for you
                </div>

                {/* File Input and Upload Button */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.docx"
                />
                <button
                    onClick={handleUploadClick}
                    disabled={isLoading}
                    className="font-secondary text-xs md:text-lg bg-primary text-light px-7 py-3 rounded-full shadow-[0_6px_10px_rgba(0,0,0,0.15)] dark:shadow-[0_6px_30px_rgba(255,255,248,0.2)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_8px_40px_rgba(255,255,248,0.3)] hover:bg-primary/[0.98] transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        'Upload Resume'
                    )}
                </button>
            </div>
        </div>
    );
}

