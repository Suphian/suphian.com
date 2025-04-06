
import React, { useEffect, useRef, useState } from "react";

interface SpacerBannerProps {
  imageUrl: string;
}

interface AnimatedImageProps {
  src: string;
  alt: string;
  position: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  size: string;
  speed: number;
  delay: number;
}

const AnimatedImage: React.FC<AnimatedImageProps> = ({ 
  src, 
  alt, 
  position, 
  size, 
  speed, 
  delay 
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
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
  }, [delay]);
  
  return (
    <img 
      ref={imageRef}
      src={src} 
      alt={alt} 
      className={`absolute object-contain ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ 
        ...position,
        maxWidth: size,
        transition: `transform 0.05s linear, opacity 1s ease-out ${delay}ms`,
        transform: `translateY(${speed}px)`,
        willChange: "transform, opacity",
      }}
    />
  );
};

const SpacerBanner: React.FC<SpacerBannerProps> = ({ imageUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    // Parallax scroll effect
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full py-24 md:py-32 lg:py-40 flex items-center justify-center bg-black relative overflow-hidden"
    >
      <div className="max-w-6xl w-full mx-auto px-4 relative" style={{ height: "90vh" }}>
        {/* Main SUPH logo */}
        <AnimatedImage 
          src="/lovable-uploads/f6e8babc-8563-4fc8-b1a4-99176090137a.png"
          alt="SUPH logo" 
          position={{ top: '15%', left: '50%' }}
          size="70%"
          speed={scrollY * -0.1}
          delay={0}
        />
        
        {/* Astronaut image */}
        <AnimatedImage 
          src="/lovable-uploads/d847628a-13e4-46ae-8c3c-b0892222a5b9.png"
          alt="Astronaut" 
          position={{ top: '45%', left: '25%' }}
          size="25%"
          speed={scrollY * 0.15}
          delay={200}
        />
        
        {/* Planet/moon image */}
        <AnimatedImage 
          src="/lovable-uploads/90f0aa09-5951-46d8-82ba-7cec20d0d33b.png"
          alt="Red planet" 
          position={{ top: '20%', right: '15%' }}
          size="20%"
          speed={scrollY * 0.05}
          delay={400}
        />
        
        {/* Landscape/mountains */}
        <AnimatedImage 
          src="/lovable-uploads/f33891f6-b667-47dd-aa95-8656df3bd5a1.png"
          alt="Wave landscape" 
          position={{ bottom: '10%', left: '0' }}
          size="100%"
          speed={scrollY * 0.2}
          delay={300}
        />
        
        {/* Car with airplane */}
        <AnimatedImage 
          src="/lovable-uploads/d8486bc0-8796-4e81-9a43-b7beadb5f260.png"
          alt="Car with airplane" 
          position={{ bottom: '35%', right: '10%' }}
          size="35%"
          speed={scrollY * -0.08}
          delay={500}
        />
      </div>
    </div>
  );
};

export default SpacerBanner;
