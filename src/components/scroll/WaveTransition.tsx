
import { RefObject } from "react";

interface WaveTransitionProps {
  transitionRef: RefObject<HTMLDivElement>;
  position?: "top" | "bottom";
  zIndex?: number;
  className?: string;
}

const WaveTransition = ({ 
  transitionRef, 
  position = "bottom", 
  zIndex = 15,
  className = "" 
}: WaveTransitionProps) => {
  return (
    <div 
      ref={transitionRef}
      className={`absolute ${position}-0 left-0 right-0 h-96 transform-gpu opacity-0 ${className}`}
      style={{ 
        zIndex,
        transition: "transform 0.2s linear, opacity 0.4s ease-out"
      }}
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

export default WaveTransition;
