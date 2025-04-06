
import { useEffect, useRef } from "react";

interface ScrollTransitionProps {
  className?: string;
}

const ScrollTransition = ({ className = "" }: ScrollTransitionProps) => {
  const transitionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!transitionRef.current) return;
      
      const scrollPosition = window.scrollY;
      const viewportHeight = window.innerHeight;
      const transitionElement = transitionRef.current;
      
      // Calculate the scale and opacity based on scroll position
      // Start animating when user starts scrolling
      const scrollProgress = Math.min(scrollPosition / (viewportHeight * 0.5), 1);
      const scale = 1 - (scrollProgress * 0.5); // Scale from 1 to 0.5
      const translateY = scrollProgress * -150; // Move up as user scrolls
      const opacity = 1 - scrollProgress * 0.8; // Fade out as user scrolls
      
      // Apply the transforms
      transitionElement.style.transform = `scale(${scale}) translateY(${translateY}px)`;
      transitionElement.style.opacity = `${opacity}`;
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  return (
    <div 
      ref={transitionRef}
      className={`absolute bottom-0 left-0 right-0 h-96 transition-transform duration-300 ease-out transform-gpu ${className}`}
    >
      <svg 
        viewBox="0 0 1440 320" 
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <path 
          fill="hsl(var(--primary))" 
          fillOpacity="0.1"
          d="M0,96L48,112C96,128,192,160,288,181.3C384,203,480,213,576,202.7C672,192,768,160,864,165.3C960,171,1056,213,1152,218.7C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
    </div>
  );
};

export default ScrollTransition;
