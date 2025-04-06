
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
      <SpacerBanner imageUrl="/lovable-uploads/920a7519-8137-4f39-a3fe-eb077e375f9b.png" />
      <div id="projects-section">
        <Projects />
      </div>
    </div>
  );
};

export default Index;
