
import LandingPage from "@/components/LandingPage";
import Projects from "@/pages/Projects";
import SpacerBanner from "@/components/SpacerBanner";

const Index = () => {
  return (
    <div>
      <LandingPage />
      <SpacerBanner imageUrl="/lovable-uploads/16c9df9e-3e8d-4436-b76f-f95ae70255b4.png" />
      <div id="projects-section">
        <Projects />
      </div>
    </div>
  );
};

export default Index;
