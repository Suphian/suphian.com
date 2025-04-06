
import { useRef } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import WaveTransition from "@/components/scroll/WaveTransition";
import ParallaxImage from "@/components/scroll/ParallaxImage";

interface ScrollTransitionProps {
  className?: string;
  landingRef: React.RefObject<HTMLDivElement>;
  projectsRef: React.RefObject<HTMLDivElement>;
}

const ScrollTransition = ({ className = "", landingRef, projectsRef }: ScrollTransitionProps) => {
  const transitionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  
  useScrollAnimation({ 
    transitionRef, 
    imageRef,
    landingRef,
    projectsRef
  });
  
  return (
    <div className={`pointer-events-none ${className}`}>
      <ParallaxImage 
        imageRef={imageRef}
        imageSrc="/lovable-uploads/6fbb55f2-ad2f-4646-9f3a-382f1ffc8c31.png"
        altText="Astronaut flying over mountains"
      />
      <WaveTransition transitionRef={transitionRef} />
    </div>
  );
};

export default ScrollTransition;
