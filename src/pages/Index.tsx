
import LandingPage from "@/components/LandingPage";
import ScrollTransition from "@/components/ScrollTransition";
import { useEffect, useRef } from "react";

const Index = () => {
  const landingRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset scroll position when the component mounts
    window.scrollTo(0, 0);
    
    // Add smooth scrolling to the body for this page only
    document.body.style.scrollBehavior = "smooth";
    
    return () => {
      document.body.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <div className="relative">
      {/* Landing page with transition */}
      <div className="relative min-h-[200vh] bg-black">
        {/* Landing content wrapped in a ref - higher z-index to overlay the image */}
        <div 
          ref={landingRef}
          className="min-h-screen flex flex-col transition-all duration-700 ease-out relative z-20"
          style={{ 
            willChange: "opacity, transform",
            // Add a subtle backdrop filter to improve text readability over the image
            backdropFilter: "blur(0px)",
            WebkitBackdropFilter: "blur(0px)"
          }}
        >
          <LandingPage />
        </div>
        
        {/* Scroll transition elements */}
        <ScrollTransition 
          landingRef={landingRef} 
          projectsRef={contentRef} 
        />
        
        {/* Content section */}
        <div 
          id="content-section" 
          ref={contentRef}
          className="relative bg-gradient-to-b from-black to-black/95 min-h-screen z-30"
          style={{ 
            opacity: 0, 
            transform: "translateY(40px)", 
            transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
            willChange: "opacity, transform"
          }}
        >
          {/* Main content will go here */}
        </div>
      </div>
    </div>
  );
};

export default Index;
