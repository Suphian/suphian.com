
import LandingPage from "@/components/LandingPage";
import Projects from "@/pages/Projects";

const Index = () => {
  return (
    <div>
      <LandingPage />
      <div id="projects-section">
        <Projects />
      </div>
    </div>
  );
};

export default Index;
