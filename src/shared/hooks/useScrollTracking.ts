
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
  const _lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('down');

  useEffect(() => {
    // Use Intersection Observer for better performance
    const observerOptions = {
      threshold: [0, 0.1, 0.3, 0.5, 0.7, 1.0],
      rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const sectionName = entry.target.getAttribute('data-section-name');
        if (!sectionName) return;

        const section = sections.find(s => s.name === sectionName);
        if (!section) return;

        const threshold = section.threshold || 0.3;
        const isInView = entry.intersectionRatio >= threshold;
        
        if (isInView && !viewedSections.current.has(sectionName)) {
          viewedSections.current.add(sectionName);
          
          // Only log in development mode to reduce console noise
          if (process.env.NODE_ENV === 'development') {
            console.log(`📍 Section viewed: ${sectionName} (${Math.round(entry.intersectionRatio * 100)}% visible)`);
          }
          
          // Track the event (only once per section)
          window.trackEvent?.("section_viewed", {
            section: sectionName,
            progress: Math.round(entry.intersectionRatio * 100),
            timestamp: Date.now(),
            page: window.location.pathname
          });
          
          onSectionView?.(sectionName, entry.intersectionRatio);
        }
      });
    }, observerOptions);

    // Observe all sections
    sections.forEach(({ name, ref }) => {
      if (ref.current) {
        ref.current.setAttribute('data-section-name', name);
        observer.observe(ref.current);
      }
    });
    
    return () => {
      observer.disconnect();
    };
  }, [sections, onSectionView]);

  return {
    viewedSections: viewedSections.current,
    scrollDirection: scrollDirection.current
  };
};
