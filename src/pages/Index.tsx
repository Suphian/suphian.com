
import { useEffect, useRef, useState, useCallback } from "react";
import LandingPage from "@/components/LandingPage";
import ScrollTransition from "@/components/ScrollTransition";
import Hero from "@/components/Hero";
import RequestCVModal from "@/components/RequestCVModal";
import ContactSheet from "@/components/ContactSheet";
import { initializeRevealAnimations } from "@/lib/animations";
import { useScrollTracking } from "@/hooks/useScrollTracking";
import { useEventTracker } from "@/hooks/useEventTracker";
import ContentSection from "@/components/sections/ContentSection";

const Index = () => {
  const landingRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const experienceSectionRef = useRef<HTMLDivElement>(null);
  const parallaxImageRef = useRef<HTMLDivElement>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  
  // Initialize secure event tracking for this page
  useEventTracker({
    autoTrackPageViews: true,
    autoTrackClicks: true,
    autoTrackScrollEvents: true
  });
  
  // Set up scroll tracking for all major sections
  const scrollSections = [
    { name: "landing", ref: landingRef, threshold: 0.5 },
    { name: "parallax-image", ref: parallaxImageRef, threshold: 0.3 },
    { name: "about-story", ref: aboutSectionRef, threshold: 0.4 },
    { name: "experience", ref: experienceSectionRef, threshold: 0.4 }
  ];

  const { viewedSections } = useScrollTracking({
    sections: scrollSections,
    onSectionView: (sectionName, progress) => {
      // Only log engagement events in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 User engaged with: ${sectionName} section (${Math.round(progress * 100)}% visible)`);
        
        // You can add custom logic here for each section
        switch (sectionName) {
          case "landing":
            console.log("👋 User saw the landing/greeting");
            break;
          case "parallax-image":
            console.log("🚀 User saw the astronaut image");
            break;
          case "about-story":
            console.log("📖 User is reading your story");
            break;
          case "experience":
            console.log("💼 User is viewing your experience");
            break;
        }
      }
    }
  });
  
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
  const handleGetInTouchFromModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => {
      setContactOpen(true);
      window.trackEvent?.("open_contact_sheet", {
        label: "Open ContactSheet via CV Modal",
        page: window.location.pathname,
        fromModal: true,
      });
    }, 125);
  }, []);

  // Track every time ContactSheet is opened from Index
  const handleContactOpenChange = useCallback((open: boolean) => {
    setContactOpen(open);
    if (open) {
      window.trackEvent?.("open_contact_sheet", {
        page: window.location.pathname,
        label: "Open ContactSheet",
        source: "IndexMainContent",
      });
    }
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
            backdropFilter: "blur(0px)",
            WebkitBackdropFilter: "blur(0px)"
          }}
        >
          <LandingPage />
        </div>
        
        {/* Scroll transition elements - pass the parallax image ref for tracking */}
        <ScrollTransition 
          landingRef={landingRef} 
          projectsRef={contentRef}
          parallaxImageRef={parallaxImageRef}
        />
        
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

          {/* Content Sections - pass refs for tracking */}
          <ContentSection 
            onRequestCV={() => {
              setIsModalOpen(true);
              window.trackEvent?.("open_cv_modal", {
                label: "Request CV",
                page: window.location.pathname,
                source: "IndexHeroContent",
              });
            }} 
            onContactClick={() => {
              handleContactOpenChange(true);
            }}
            aboutSectionRef={aboutSectionRef}
            experienceSectionRef={experienceSectionRef}
          />
          
          {/* CV Request Modal - now with onGetInTouch prop */}
          <RequestCVModal 
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) {
                window.trackEvent?.("close_cv_modal", {
                  page: window.location.pathname,
                  source: "Index",
                });
              }
            }}
            onGetInTouch={handleGetInTouchFromModal}
          />

          {/* Contact Sheet */}
          <ContactSheet open={contactOpen} onOpenChange={handleContactOpenChange} />
        </div>
      </div>
    </div>
  );
};

export default Index;
