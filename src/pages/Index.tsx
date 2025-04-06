
import LandingPage from "@/components/LandingPage";
import Projects from "@/pages/Projects";
import SpacerBanner from "@/components/SpacerBanner";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    // Reset scroll position when the component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative">
      {/* Landing page with higher z-index for scroll effect */}
      <div className="relative z-10 bg-black">
        <LandingPage />
      </div>
      
      {/* Banner with negative margin to create overlap */}
      <SpacerBanner imageUrl="/lovable-uploads/3198b560-afb3-4595-a9cf-65b3e75eaf45.png" />
      
      {/* Projects section with higher z-index to overlay the banner */}
      <div id="projects-section" className="relative z-10 bg-black">
        <Projects />
      </div>
    </div>
  );
};

export default Index;
