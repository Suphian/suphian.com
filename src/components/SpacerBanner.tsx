
import React, { useEffect, useRef } from "react";

interface SpacerBannerProps {
  imageUrl: string;
}

const SpacerBanner: React.FC<SpacerBannerProps> = ({ imageUrl }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Animation for the image reveal
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (imageRef.current) {
      observer.observe(imageRef.current);
    }
    
    // Parallax scroll effect
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollPosition = window.scrollY;
        const containerTop = containerRef.current.getBoundingClientRect().top + window.scrollY;
        const offset = scrollPosition - containerTop;
        
        // Only apply parallax when the container is in view
        if (offset > -window.innerHeight && offset < containerRef.current.offsetHeight) {
          const parallaxValue = offset * 0.4; // Adjust speed factor here
          if (imageRef.current) {
            imageRef.current.style.transform = `translateY(${parallaxValue}px)`;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full py-16 md:py-24 flex items-center justify-center bg-black relative overflow-hidden"
    >
      <div className="max-w-4xl w-full mx-auto px-4 relative" style={{ height: "65vh" }}>
        <img 
          ref={imageRef}
          src={imageUrl} 
          alt="Suph logo with astronaut and red planet" 
          className="w-full max-w-md mx-auto object-contain reveal absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{ 
            maxHeight: "100%",
            willChange: "transform"
          }}
        />
      </div>
    </div>
  );
};

export default SpacerBanner;
