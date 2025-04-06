
import { useEffect, RefObject } from "react";
import { calculateScrollAnimationValues } from "@/lib/scrollUtils";

interface UseScrollAnimationProps {
  transitionRef: RefObject<HTMLDivElement>;
  imageRef: RefObject<HTMLDivElement>;
}

export const useScrollAnimation = ({ transitionRef, imageRef }: UseScrollAnimationProps) => {
  useEffect(() => {
    const handleScroll = () => {
      if (!transitionRef.current || !imageRef.current) return;
      
      const scrollPosition = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      const { scale, translateY, opacity } = calculateScrollAnimationValues(scrollPosition, viewportHeight);
      
      // Apply the transforms to both the wave and image
      transitionRef.current.style.transform = `scale(${scale}) translateY(${translateY}px)`;
      transitionRef.current.style.opacity = `${opacity}`;
      
      // Apply different transform to the image for parallax effect
      imageRef.current.style.transform = `translateY(${translateY * 0.7}px)`;
      imageRef.current.style.opacity = `${opacity}`;
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [transitionRef, imageRef]);
};
