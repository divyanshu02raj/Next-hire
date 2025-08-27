'use client'

import { Bookmark, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
// import Image from "next/image";

export default function Hero() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains("dark"));
    }, []);

    const toggleTheme = () => {
        const html = document.documentElement;
        html.classList.add("transition-colors", "duration-200");
        if (html.classList.contains("dark")) {
            html.classList.remove("dark");
            setIsDark(false);
        } else {
            html.classList.add("dark");
            setIsDark(true);
        }
        // Remove transition classes after animation
        setTimeout(() => {
            html.classList.remove("transition-colors", "duration-200");
        }, 200);
    };

    return (
        <div className="relative flex flex-col items-center gap-20 jusitfy-center pt-12 md:pt-36 h-screen w-full">
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    opacity: 0.09,
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 5%, transparent 100%)',
                    maskImage: 'radial-gradient(ellipse at center, black 5%, transparent 100%)',
                }}
            >
                <div className={`w-full h-full ${isDark ? "bg-grid-white" : "bg-grid-black"}`} />
            </div>
            <div className="" />

            <div className="relative flex flex-col items-center gap-6 md:gap-8">
                <div className="flex flex-row items-center">
                    <div className="hidden px-4 py-3 rounded-full items-center md:flex text-center font-secondary text-xs md:text-l text-dark dark:text-light hover:bg-red-600 hover:text-light transition-all duration-200 ease-in-out border-2 border-red-600 bg-blur-2xl">
                        {isDark ? (
                            <Bookmark className="inline mr-2 w-3 md:w-6 h-auto"  stroke="#FFFFF8" fill="#FFFFF8" />
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
                    Ai powered job search, let ai help find perfect job roles for you
                </div>
                <button className="font-secondary text-xs md:text-lg bg-primary text-light px-7 py-3 rounded-full shadow-[0_6px_10px_rgba(0,0,0,0.15)] dark:shadow-[0_6px_30px_rgba(255,255,248,0.2)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_8px_40px_rgba(255,255,248,0.3)] hover:bg-primary/[0.98] transition-all duration-300">
                    Upload Resume
                </button>
                {/* <div className="relative w-[70vw] h-[30vw] rounded-t-4xl">
                    <Image 
                        src="/Hero.jpeg"
                        alt="hero image"
                        fill
                        className="rounded-t-4xl object-cover shadow-[0_6px_20px_5px_rgba(0,0,0,0.19)] dark:shadow-[0_6px_50px_3px_rgba(255,255,248,0.19)]"
                    />
                </div> */}
            </div>
        </div>
    );
}