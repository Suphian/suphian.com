import React, { useEffect, useMemo, useRef, useState, useCallback, Suspense } from "react";
import LandingPageCursor from "@/features/landing/components/LandingPageCursor";

const RequestCVModal = React.lazy(() =>
  import("@/features/landing/components/RequestCVModal").catch(
    () => new Promise<void>((r) => setTimeout(r, 1500)).then(
      () => import("@/features/landing/components/RequestCVModal")
    )
  )
);
import { initializeRevealAnimations } from "@/shared/lib/animations";
import { useScrollTracking } from "@/shared/hooks/useScrollTracking";
import { useEventTracker } from "@/shared/hooks/useEventTracker";
import { useContactSheet } from "@/features/contact/context/ContactSheetContext";
import ContentSection from "@/features/landing/components/sections/ContentSection";

const Index = () => {
  const landingRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const experienceSectionRef = useRef<HTMLDivElement>(null);
  const projectsSectionRef = useRef<HTMLDivElement>(null);
  const parallaxImageRef = useRef<HTMLDivElement>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { openContactSheet } = useContactSheet();

  // Initialize secure event tracking for this page
  const { track } = useEventTracker({
    autoTrackPageViews: true,
    autoTrackClicks: true,
    autoTrackScrollEvents: true
  });
  
  // Set up scroll tracking for all major sections. Both inputs are memoized —
  // useScrollTracking's effect depends on them, so fresh identities each render
  // would tear down and rebuild the IntersectionObserver constantly.
  const scrollSections = useMemo(() => [
    { name: "landing", ref: landingRef, threshold: 0.5 },
    { name: "parallax-image", ref: parallaxImageRef, threshold: 0.3 },
    { name: "about-story", ref: aboutSectionRef, threshold: 0.4 },
    { name: "experience", ref: experienceSectionRef, threshold: 0.4 },
    { name: "projects", ref: projectsSectionRef, threshold: 0.4 }
  ], []);

  const onSectionView = useCallback((sectionName: string, progress: number) => {
    if (import.meta.env.DEV) {
      console.log(`🎯 User engaged with: ${sectionName} section (${Math.round(progress * 100)}% visible)`);
    }
  }, []);

  useScrollTracking({
    sections: scrollSections,
    onSectionView
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
      openContactSheet("CVModal");
    }, 125);
  }, [openContactSheet]);

  return (
    <div className="relative">
      {/* Hero Section - Typing Text */}
      <div 
        ref={landingRef} 
        className="min-h-screen flex flex-col relative z-20"
      >
        <LandingPageCursor />
      </div>
      
      {/* Transition Section - Minimal Gap */}
      <div
        ref={parallaxImageRef}
        className="relative"
        style={{
          paddingTop: '4vh',
          paddingBottom: '4vh'
        }}
      >
      </div>
      
      {/* Content section - Story and Experience */}
      <div 
        id="content-section" 
        ref={contentRef} 
        className="relative z-30"
        style={{
          paddingTop: '4vh'
        }}
      >
        {/* Content Sections - pass refs for tracking */}
        <ContentSection
          onRequestCV={async () => {
            await import("@/features/landing/components/RequestCVModal");
            setIsModalOpen(true);
            track("open_cv_modal", {
              label: "Request CV",
              page: window.location.pathname,
              source: "IndexHeroContent",
            });
          }}
          aboutSectionRef={aboutSectionRef}
          experienceSectionRef={experienceSectionRef}
          projectsSectionRef={projectsSectionRef}
        />
        
        {/* CV Request Modal - now with onGetInTouch prop */}
        <Suspense fallback={null}>
          <RequestCVModal 
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) {
                track("close_cv_modal", {
                  page: window.location.pathname,
                  source: "Index",
                });
              }
            }}
            onGetInTouch={handleGetInTouchFromModal}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default Index;
