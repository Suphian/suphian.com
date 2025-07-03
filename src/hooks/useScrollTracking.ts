
import { useEffect, useRef, RefObject } from "react";

interface ScrollSection {
  name: string;
  ref: RefObject<HTMLElement>;
  threshold?: number;
}

interface UseScrollTrackingProps {
  sections: ScrollSection[];
  onSectionView?: (sectionName: string, progress: number) => void;
}

export const useScrollTracking = ({ sections, onSectionView }: UseScrollTrackingProps) => {
  const viewedSections = useRef<Set<string>>(new Set());
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('down');

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      // Determine scroll direction
      scrollDirection.current = currentScrollY > lastScrollY.current ? 'down' : 'up';
      lastScrollY.current = currentScrollY;

      sections.forEach(({ name, ref, threshold = 0.3 }) => {
        if (!ref.current) return;

        const element = ref.current;
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + currentScrollY;
        const elementHeight = rect.height;
        
        // Calculate if section is in view
        const elementCenter = elementTop + (elementHeight / 2);
        const scrollCenter = currentScrollY + (viewportHeight / 2);
        const distanceFromCenter = Math.abs(scrollCenter - elementCenter);
        const maxDistance = (elementHeight / 2) + (viewportHeight / 2);
        
        // Calculate progress (0 to 1) - how much of the section is visible
        const progress = Math.max(0, Math.min(1, 1 - (distanceFromCenter / maxDistance)));
        
        // Check if section is significantly in view
        const isInView = progress >= threshold;
        
        if (isInView && !viewedSections.current.has(name)) {
          viewedSections.current.add(name);
          
          // Only log in development mode to reduce console noise
          if (process.env.NODE_ENV === 'development') {
            console.log(`📍 Section viewed: ${name} (${Math.round(progress * 100)}% visible, scrolling ${scrollDirection.current})`);
          }
          
          // Track the event (only once per section)
          window.trackEvent?.("section_viewed", {
            section: name,
            progress: Math.round(progress * 100),
            scrollDirection: scrollDirection.current,
            timestamp: Date.now(),
            page: window.location.pathname
          });
          
          onSectionView?.(name, progress);
        }
      });
    };

    // Initial check
    handleScroll();
    
    // Throttled scroll listener for performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", throttledScroll);
    };
  }, [sections, onSectionView]);

  return {
    viewedSections: viewedSections.current,
    scrollDirection: scrollDirection.current
  };
};
