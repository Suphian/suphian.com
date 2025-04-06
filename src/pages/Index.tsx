
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
    <div>
      <LandingPage />
      <SpacerBanner imageUrl="/lovable-uploads/3198b560-afb3-4595-a9cf-65b3e75eaf45.png" />
      <div id="projects-section">
        <Projects />
      </div>
    </div>
  );
};

export default Index;
