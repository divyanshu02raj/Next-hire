'use client'

import { Rocket } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {

        const scrollToSection = (sectionId: string) => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: "smooth" });
        }
    }

        const [isDark, setIsDark] = useState(false);
    
        useEffect(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        }, []);

    return(
        <>
        <div className="md:fixed top-0 z-50 flex  bg-light/[0.3] backdrop-blur-xl w-full dark:bg-dark/[0.3]  flex-row items-center justify-between py-4 px-7 md:px-16 md:py-6 ">
            
            <div className="font-primary text-xl md:text-4xl text-dark dark:text-light">
                {isDark ? (
                    <Rocket className="inline mr-2" size={28} fill="#FFFFF8"/> )  : (
                    <Rocket className="inline mr-2" size={28} fill="#121212" />
                    )}
                NEXT HIRE
            </div>
            <div className="font-secondary text-dark dark:text-light text-xs md:text-xl gap-6 md:gap-14 flex flex-row items-center">
                <a
                href="#home"
                onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("home");
                }}
                className=" hover:text-primary transition-all duration-200 ease-in"
                >
                    Home
                </a>
                <a
                href="/whyus"
                onClick={(e) => {
                e.preventDefault();
                scrollToSection("whyus");
                }}
                className=" hover:text-primary transition-all duration-200 ease-in"
                >
                    Why Us?
                </a>
                <a
                href="#queries"
                onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("queries");
                }}
                className=" hover:text-primary transition-all duration-200 ease-in"
                >
                    Queries
                </a>
            </div>

        </div>
        </>
    )
}