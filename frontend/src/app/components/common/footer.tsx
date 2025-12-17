// frontend\src\app\components\common\footer.tsx
export default function Footer() {
    return (
        <>
        <div className="flex flex-col mask-b-from-50% bg-primary w-full overflow-hidden" >

            <div className="flex flex-row px-8 md:px-44 pt-16 items-start justify-between ">

                <div className="flex flex-col">

                    <div className="font-secondary font-medium text-left text-4xl text-light mb-6">
                        Contact Us
                    </div>

                    <form>
                    <div className="flex flex-row items-center gap-4">
                    <input
                        type="email"
                        placeholder="Your Email"
                        className="w-full max-w-md px-4 py-2 mt-2 text-dark dark:text-light bg-white/[0.6] dark:bg-neutral-800/[0.6] rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                        type="text"
                        placeholder="Your Name"
                        className="w-full max-w-md px-4 py-2 text-dark dark:text-light bg-white/[0.6] dark:bg-neutral-800/[0.6] rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    </div>
                        <div className="mt-4">
                            <textarea
                                placeholder="Your Message"
                                className="w-full max-w-md px-4 py-2 text-dark dark:text-light bg-white/[0.6] dark:bg-neutral-800/[0.6] rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
                                rows={4}
                            />
                        </div>

                        <button className="bg-amber-800/[0.8] font-secondary font-medium   text-light px-8 py-3 rounded-full mt-5">
                            Send
                        </button>
                    </form>
                </div>

                <div className="hidden md:flex flex-col">
                    <div className="font-secondary font-medium text-left text-4xl text-light"> 
                        Navigation
                    </div>
                    <ul className="text-light text-xl mt-8">
                        <li className="mt-2 hover:underline transition-all duration-300 ease-in">Home</li>
                        <li className="mt-2 hover:underline transition-all duration-300 ease-in">About</li>
                        <li className="mt-2 hover:underline transition-all duration-300 ease-in">FAQ</li>
                    </ul>
                    
                </div>

            </div>

            <div className="font-secondary text-center text-light font-medium text-xl mt-10">
                Next Hire | © 2025 All rights reserved.
            </div>

            <div className="font-primary text-[28vw] md:text-[51.4ch] md:-mt-[4vw] -mb-[20vw] md:-mb-[22vw] text-light text-center">
                NEXT HIRE
            </div>
        </div>
        </>
    )
}