
import React, { useEffect, useRef, useState } from "react";

interface SpacerBannerProps {
  imageUrl: string;
}

const SpacerBanner: React.FC<SpacerBannerProps> = ({ imageUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Parallax scroll effect
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    
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
      window.removeEventListener('scroll', handleScroll);
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full py-6 bg-black relative overflow-hidden"
    >
      <div className="max-w-6xl w-full mx-auto px-4 relative" style={{ height: "150vh" }}>
        {/* Main SUPH logo */}
        <img 
          src={imageUrl}
          alt="SUPH logo" 
          className={`absolute object-contain transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translateY(${scrollY * -0.1}px)`,
            maxWidth: '90%',
            maxHeight: '90%',
            width: 'auto',
            height: 'auto'
          }}
        />
      </div>
    </div>
  );
};

export default SpacerBanner;
