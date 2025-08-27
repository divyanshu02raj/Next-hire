import Image from "next/image";

export default function Whyus() {
    return(
        <>
        <div className="flex flex-col gap-12 px-4 md:px-24 lg:px-52 -mt-80 md:mt-0">
            <div className="font-primary text-5xl pl-12 md:pl-4 text-dark dark:text-light ">
                Why Us?
            </div>

            <div className="flex flex-col md:grid md:grid-cols-2 items-center jusitfy-center gap-y-8">

                <div className="font-secondary px-8 md:px-16 tracking-tight text-dark dark:text-light text-2xl font-medium ">
                    Smart Parsing <br /> <span className="font-normal text-xl text-stone-500">Instant resume parsing and extraction of skills, jobs, and education. Just upload your PDF or docx.</span>
                </div>
                <div className="hidden md:block">
                    <Image 
                    src="/smart-parsing-dark.svg"
                    alt="why us image"
                    width={400}
                    height={400}
                    className="rounded-2xl hidden md:block shadow-[0_6px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_6px_40px_rgba(255,255,248,0.1)]"
                    />
                </div>

                <div className="hidden md:block">
                    <Image 
                    src="/jobs-dark.svg"
                    alt="why us image"
                    width={410}
                    height={400}
                    className="rounded-2xl  hidden md:block shadow-[0_6px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_6px_40px_rgba(255,255,248,0.1)]"
                    />
                </div>
                <div className="font-secondary px-8 md:px-0 tracking-tight text-dark dark:text-light text-2xl font-medium ">
                    Best-Matched Jobs <br /> <span className="font-normal text-xl text-stone-500">Personalized job cards with AI-powered match scores, real-time filters, and easy apply.</span>
                </div>


                <div className="font-secondary px-8 md:px-16 tracking-tight text-dark dark:text-light text-2xl font-medium ">
                    Progress Dashboard <br /> <span className="font-normal text-xl text-stone-500">Visualize your entire job search with live stats, feedback, and tracked applications.</span>
                </div>
                <div className="hidden md:block">
                    <Image 
                    src="/dashboard-dark.svg"
                    alt="why us image"
                    width={400}
                    height={400}
                    className="rounded-2xl  hidden md:block shadow-[0_6px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_6px_40px_rgba(255,255,248,0.1)]"
                    />
                </div>

            </div>

        </div>
        </>
    )
}