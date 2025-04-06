
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
      <SpacerBanner imageUrl="/lovable-uploads/f6e8babc-8563-4fc8-b1a4-99176090137a.png" />
      <div id="projects-section">
        <Projects />
      </div>
    </div>
  );
};

export default Index;
