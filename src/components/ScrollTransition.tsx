
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
  const projectsTransitionRef = useRef<HTMLDivElement>(null);
  
  useScrollAnimation({ 
    transitionRef, 
    imageRef,
    projectsTransitionRef,
    landingRef,
    projectsRef
  });
  
  return (
    <div className={`pointer-events-none ${className}`}>
      {/* Background gradient overlay for smoother transitions */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-transparent opacity-70 z-0"></div>
      
      {/* Parallax image that will slide under the text */}
      <ParallaxImage 
        imageRef={imageRef}
        imageSrc="/lovable-uploads/d847628a-13e4-46ae-8c3c-b0892222a5b9.png"
        altText="SUPH astronaut branding"
        zIndex={5} // Lower z-index to ensure it stays behind text
      />
      
      {/* Wave transition effect for landing -> projects */}
      <WaveTransition transitionRef={transitionRef} zIndex={15} />
      
      {/* Wave transition effect for projects section */}
      <WaveTransition 
        transitionRef={projectsTransitionRef} 
        position="top" 
        zIndex={30} 
        className="rotate-180"
      />
    </div>
  );
};

export default ScrollTransition;
