
import React, { useEffect, useRef } from "react";

interface SpacerBannerProps {
  imageUrl: string;
}

const SpacerBanner: React.FC<SpacerBannerProps> = ({ imageUrl }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
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
    
    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full py-16 md:py-24 flex items-center justify-center bg-black relative overflow-hidden">
      <div className="max-w-4xl w-full mx-auto px-4">
        <img 
          ref={imageRef}
          src={imageUrl} 
          alt="Suph logo with astronaut and red planet" 
          className="w-full max-w-md mx-auto object-contain reveal"
          style={{ 
            maxHeight: "65vh"
          }}
        />
      </div>
    </div>
  );
};

export default SpacerBanner;
