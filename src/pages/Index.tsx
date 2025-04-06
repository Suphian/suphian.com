
import LandingPage from "@/components/LandingPage";
import Projects from "@/pages/Projects";
import ScrollTransition from "@/components/ScrollTransition";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    // Reset scroll position when the component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative">
      {/* Landing page with transition */}
      <div className="relative bg-black min-h-screen flex flex-col">
        <LandingPage />
        <ScrollTransition className="z-10" />
      </div>
      
      {/* Projects section */}
      <div id="projects-section" className="relative bg-black">
        <Projects />
      </div>
    </div>
  );
};

export default Index;
