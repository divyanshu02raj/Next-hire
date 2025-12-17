// frontend\src\app\page.tsx
import Navbar from "./components/common/navbar";
import Hero from "./components/landingpage/hero";
import Whyus from "./components/landingpage/whyus";
import Queries from "./components/landingpage/queries";
import Footer from "./components/common/footer";

export default function Home() {
  return (
   <>
   <Navbar />
   <div className="flex flex-col items-center justify-center gap-[5vw]">
    <div id="home" className="w-full">
   <Hero/>
   </div>

   <div id="whyus"> 
   <Whyus />
   </div>

   <div id="queries">
   <Queries />
    </div>

    </div>
    <Footer />
   </>
  );
}
