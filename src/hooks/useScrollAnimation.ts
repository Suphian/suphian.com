
import { useEffect, RefObject } from "react";
import { calculateScrollAnimationValues } from "@/lib/scrollUtils";

interface UseScrollAnimationProps {
  transitionRef: RefObject<HTMLDivElement>;
  imageRef: RefObject<HTMLDivElement>;
  landingRef: RefObject<HTMLDivElement>;
  projectsRef: RefObject<HTMLDivElement>;
}

export const useScrollAnimation = ({ 
  transitionRef, 
  imageRef,
  landingRef,
  projectsRef
}: UseScrollAnimationProps) => {
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      const {
        landingOpacity,
        imageOpacity,
        imageScale,
        imageTranslateY,
        projectsOpacity,
        projectsTranslateY
      } = calculateScrollAnimationValues(scrollPosition, viewportHeight);
      
      // Apply transitions to landing content
      if (landingRef.current) {
        landingRef.current.style.opacity = `${landingOpacity}`;
        landingRef.current.style.transform = `translateY(${landingOpacity * 20}px)`;
      }
      
      // Apply transitions to image
      if (imageRef.current) {
        imageRef.current.style.opacity = `${imageOpacity}`;
        imageRef.current.style.transform = `scale(${imageScale}) translateY(${imageTranslateY}px)`;
      }
      
      // Apply transitions to wave
      if (transitionRef.current) {
        transitionRef.current.style.opacity = `${imageOpacity * 0.3}`; // Keep the wave less visible
        transitionRef.current.style.transform = `scale(${imageScale}) translateY(${imageTranslateY * 0.7}px)`;
      }
      
      // Apply transitions to projects section
      if (projectsRef.current) {
        projectsRef.current.style.opacity = `${projectsOpacity}`;
        projectsRef.current.style.transform = `translateY(${projectsTranslateY}px)`;
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    // Initial call to set positions correctly on page load
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [transitionRef, imageRef, landingRef, projectsRef]);
};
