import { useEffect, useRef, useState } from "react";
import LandingPage from "@/components/LandingPage";
import ScrollTransition from "@/components/ScrollTransition";
import Hero from "@/components/Hero";
import RequestCVModal from "@/components/RequestCVModal";
import ContactSheet from "@/components/ContactSheet";
import { initializeRevealAnimations } from "@/lib/animations";
import ContentSection from "@/components/sections/ContentSection";

const Index = () => {
  const landingRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  
  useEffect(() => {
    // Reset scroll position when the component mounts
    window.scrollTo(0, 0);

    // Add smooth scrolling to the body for this page only
    document.body.style.scrollBehavior = "smooth";

    // Initialize reveal animations
    const cleanup = initializeRevealAnimations();
    return () => {
      document.body.style.scrollBehavior = "auto";
      cleanup();
    };
  }, []);
  
  // Handles workflow when user clicks "Get in Touch" in the modal
  const handleGetInTouchFromModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setContactOpen(true);
    }, 125); // faster transition from modal to side panel
  };

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
            backdropFilter: "blur(0px)",
            WebkitBackdropFilter: "blur(0px)"
          }}
        >
          <LandingPage />
        </div>
        
        {/* Scroll transition elements */}
        <ScrollTransition landingRef={landingRef} projectsRef={contentRef} />
        
        {/* Content section - Hero with About Me */}
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
          {/* About Me Hero section */}
          <Hero />

          {/* Content Sections */}
          <ContentSection 
            onRequestCV={() => setIsModalOpen(true)} 
            onContactClick={() => setContactOpen(true)} 
          />
          
          {/* CV Request Modal - now with onGetInTouch prop */}
          <RequestCVModal 
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onGetInTouch={handleGetInTouchFromModal}
          />

          {/* Contact Sheet */}
          <ContactSheet open={contactOpen} onOpenChange={setContactOpen} />
        </div>
      </div>
    </div>
  );
};

export default Index;
