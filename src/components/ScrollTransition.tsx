
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
  const projectsImageRef = useRef<HTMLDivElement>(null);
  
  useScrollAnimation({ 
    transitionRef, 
    imageRef,
    projectsTransitionRef,
    projectsImageRef,
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
        imageSrc="/lovable-uploads/6fbb55f2-ad2f-4646-9f3a-382f1ffc8c31.png"
        altText="Astronaut flying over mountains"
        zIndex={10}
      />
      
      {/* Second parallax image for projects transition */}
      <ParallaxImage
        imageRef={projectsImageRef}
        imageSrc="/lovable-uploads/920a7519-8137-4f39-a3fe-eb077e375f9b.png"
        altText="Space exploration"
        zIndex={25}
        initialPosition="translateY(30vh) scale(0.9)"
        className="opacity-0"
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
