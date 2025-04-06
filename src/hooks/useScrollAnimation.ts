
import { useEffect, RefObject } from "react";
import { calculateScrollAnimationValues } from "@/lib/scrollUtils";

interface UseScrollAnimationProps {
  transitionRef: RefObject<HTMLDivElement>;
  imageRef: RefObject<HTMLDivElement>;
  projectsTransitionRef: RefObject<HTMLDivElement>;
  projectsImageRef: RefObject<HTMLDivElement>;
  landingRef: RefObject<HTMLDivElement>;
  projectsRef: RefObject<HTMLDivElement>;
}

export const useScrollAnimation = ({ 
  transitionRef, 
  imageRef,
  projectsTransitionRef,
  projectsImageRef,
  landingRef,
  projectsRef
}: UseScrollAnimationProps) => {
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      const {
        landingOpacity,
        landingTranslateY,
        landingScale,
        imageOpacity,
        imageScale,
        imageTranslateY,
        waveOpacity,
        waveTranslateY,
        projectWaveOpacity,
        projectWaveTranslateY,
        projectsOpacity,
        projectsTranslateY
      } = calculateScrollAnimationValues(scrollPosition, viewportHeight);
      
      // Apply transitions to landing content with transforms
      if (landingRef.current) {
        landingRef.current.style.opacity = `${landingOpacity}`;
        landingRef.current.style.transform = `translateY(${landingTranslateY}px) scale(${landingScale})`;
      }
      
      // Apply transitions to image with more dramatic movement
      if (imageRef.current) {
        imageRef.current.style.opacity = `${imageOpacity}`;
        imageRef.current.style.transform = `translateY(${imageTranslateY}vh) scale(${imageScale})`;
      }
      
      // Apply transitions to wave
      if (transitionRef.current) {
        transitionRef.current.style.opacity = `${waveOpacity}`;
        transitionRef.current.style.transform = `translateY(${waveTranslateY}px)`;
      }
      
      // Apply transitions to projects section
      if (projectsRef.current) {
        projectsRef.current.style.opacity = `${projectsOpacity}`;
        projectsRef.current.style.transform = `translateY(${projectsTranslateY}px)`;
      }
      
      // Apply transitions to projects wave
      if (projectsTransitionRef.current) {
        projectsTransitionRef.current.style.opacity = `${projectWaveOpacity}`;
        projectsTransitionRef.current.style.transform = `translateY(${projectWaveTranslateY}px)`;
      }
      
      // Apply transitions to projects image
      if (projectsImageRef.current) {
        // Start showing the second image as the projects section becomes visible
        const projectsImageOpacity = Math.max(0, projectsOpacity - 0.3);
        projectsImageRef.current.style.opacity = `${projectsImageOpacity}`;
        
        // Scale and move the image as we scroll to create parallax
        if (projectsOpacity > 0.1) {
          const scale = 0.9 + (projectsOpacity * 0.2);
          const translateY = 30 - (projectsOpacity * 40);
          projectsImageRef.current.style.transform = `translateY(${translateY}vh) scale(${scale})`;
        }
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    // Initial call to set positions correctly on page load
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [transitionRef, imageRef, projectsTransitionRef, projectsImageRef, landingRef, projectsRef]);
};
