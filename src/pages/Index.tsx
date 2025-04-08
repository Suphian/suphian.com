
import { useState, useEffect, useRef } from "react";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/lib/projects";
import RequestCVModal from "@/components/RequestCVModal";
import ParallaxImage from "@/components/scroll/ParallaxImage";
import WaveTransition from "@/components/scroll/WaveTransition";
import ContentSection from "@/components/sections/ContentSection";
import LeadershipSection from "@/components/sections/LeadershipSection";
import ContactSection from "@/components/sections/ContactSection";
import LandingPage from "@/components/LandingPage";
import CompanyLogos from "@/components/CompanyLogos";
import { initializeRevealAnimations } from "@/lib/animations";

const Index = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const projectsSectionRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef(null);
  
  useEffect(() => {
    const cleanup = initializeRevealAnimations();
    return cleanup;
  }, []);
  
  const handleRequestCV = () => {
    setIsModalOpen(true);
  };
  
  const handleContactClick = () => {
    const contactSection = document.getElementById("contact-section");
    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: "smooth"
      });
    }
  };
  
  return <div className="min-h-screen">
      {/* Hero Section with Animated Greeting */}
      <LandingPage />

      {/* Content Section with About and Experience */}
      <ContentSection onRequestCV={handleRequestCV} onContactClick={handleContactClick} />

      {/* Company Logos Section */}
      <CompanyLogos />

      {/* Wave Transition */}
      <WaveTransition transitionRef={transitionRef} />

      {/* Leadership Section */}
      <LeadershipSection />

      {/* Projects Section with Parallax Images */}
      <section id="projects-section" ref={projectsSectionRef} className="relative py-24 md:py-32 bg-background/50">
        {/* Background Parallax Images */}
        <ParallaxImage 
          imageSrc="/lovable-uploads/b5feb4e9-6b23-421b-90ba-ffa4d4f48992.png" 
          className="hidden md:block w-64 h-64 absolute -top-20 -left-20 opacity-15 blur-sm" 
          altText="Background shape 1"
        />
        <ParallaxImage 
          imageSrc="/lovable-uploads/f6e8babc-8563-4fc8-b1a4-99176090137a.png" 
          className="hidden md:block w-80 h-80 absolute bottom-20 -right-32 opacity-15 blur-sm" 
          altText="Background shape 2"
        />
      </section>

      {/* Contact Section */}
      <ContactSection onContactClick={handleContactClick} />
      
      {/* CV Request Modal */}
      <RequestCVModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>;
};
export default Index;
