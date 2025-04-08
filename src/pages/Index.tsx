
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
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Animated Greeting */}
      <LandingPage />

      {/* Content Section with About and Experience */}
      <ContentSection 
        onRequestCV={handleRequestCV} 
        onContactClick={handleContactClick}
      />

      {/* Company Logos Section */}
      <CompanyLogos />

      {/* Wave Transition */}
      <WaveTransition />

      {/* Leadership Section */}
      <LeadershipSection />

      {/* Projects Section with Parallax Images */}
      <section id="projects-section" ref={projectsSectionRef} className="relative py-24 md:py-32 bg-background/50">
        <div className="container-custom relative z-10">
          <h2 className="heading-xl text-center mb-16">Recent Projects</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <ProjectCard
                key={index}
                index={index}
                title={project.title}
                description={project.shortDescription}
                image={project.image}
                slug={project.slug}
                tags={project.tags}
              />
            ))}
          </div>
        </div>

        {/* Background Parallax Images */}
        <ParallaxImage
          src="/lovable-uploads/b5feb4e9-6b23-421b-90ba-ffa4d4f48992.png"
          className="hidden md:block w-64 h-64 absolute -top-20 -left-20 opacity-15 blur-sm"
          speed={0.3}
          direction="down"
        />
        <ParallaxImage
          src="/lovable-uploads/f6e8babc-8563-4fc8-b1a4-99176090137a.png"
          className="hidden md:block w-80 h-80 absolute bottom-20 -right-32 opacity-15 blur-sm"
          speed={0.2}
          direction="up"
        />
      </section>

      {/* Contact Section */}
      <ContactSection />
      
      {/* CV Request Modal */}
      <RequestCVModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
};

export default Index;
