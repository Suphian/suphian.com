
import { useEffect, RefObject } from "react";
import { calculateScrollAnimationValues } from "@/lib/scrollUtils";

interface UseScrollAnimationProps {
  transitionRef: RefObject<HTMLDivElement>;
  imageRef: RefObject<HTMLDivElement>;
  projectsTransitionRef: RefObject<HTMLDivElement>;
  landingRef: RefObject<HTMLDivElement>;
  projectsRef: RefObject<HTMLDivElement>;
}

export const useScrollAnimation = ({ 
  transitionRef, 
  imageRef,
  projectsTransitionRef,
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
    };
    
    window.addEventListener("scroll", handleScroll);
    // Initial call to set positions correctly on page load
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [transitionRef, imageRef, projectsTransitionRef, landingRef, projectsRef]);
};
