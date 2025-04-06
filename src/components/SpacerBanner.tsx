
import React, { useEffect, useRef, useState } from "react";

interface SpacerBannerProps {
  imageUrl: string;
}

const SpacerBanner: React.FC<SpacerBannerProps> = ({ imageUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Intersection observer for animation
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Text to animate with staggered reveal
  const text = "SUPH DESIGN";
  const letters = text.split("");

  return (
    <div 
      ref={containerRef}
      className="w-full py-4 bg-black relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 h-[30vh] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          {/* Staggered text animation */}
          <div className="overflow-hidden">
            <div className="flex">
              {letters.map((letter, index) => (
                <div 
                  key={index} 
                  className="overflow-hidden"
                >
                  <span 
                    className="inline-block transform heading-xl text-6xl md:text-8xl lg:text-9xl"
                    style={{ 
                      transitionDelay: `${index * 0.05}s`,
                      transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
                      opacity: isVisible ? 1 : 0,
                      transition: 'transform 0.6s cubic-bezier(0.215, 0.61, 0.355, 1), opacity 0.6s cubic-bezier(0.215, 0.61, 0.355, 1)'
                    }}
                  >
                    {letter === " " ? <span>&nbsp;</span> : letter}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Original image with fade-in animation */}
          <img 
            src={imageUrl}
            alt="SUPH logo" 
            className="mt-8 transition-all duration-1000"
            style={{ 
              maxWidth: '80%',
              maxHeight: '15vh',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SpacerBanner;
