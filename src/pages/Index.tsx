
import LandingPage from "@/components/LandingPage";
import Projects from "@/pages/Projects";
import ScrollTransition from "@/components/ScrollTransition";
import { useEffect, useRef } from "react";

const Index = () => {
  const landingRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset scroll position when the component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative">
      {/* Landing page with transition */}
      <div className="relative min-h-[200vh] bg-black">
        {/* Landing content wrapped in a ref */}
        <div 
          ref={landingRef}
          className="min-h-screen flex flex-col transition-opacity duration-500"
        >
          <LandingPage />
        </div>
        
        {/* Scroll transition elements */}
        <ScrollTransition 
          className="z-10" 
          landingRef={landingRef} 
          projectsRef={projectsRef} 
        />
        
        {/* Projects section with transition effect */}
        <div 
          id="projects-section" 
          ref={projectsRef}
          className="relative bg-black min-h-screen"
          style={{ opacity: 0, transition: "opacity 0.5s ease-out" }}
        >
          <Projects />
        </div>
      </div>
    </div>
  );
};

export default Index;
