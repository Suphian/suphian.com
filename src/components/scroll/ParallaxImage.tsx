
import { RefObject, useEffect } from "react";

interface ParallaxImageProps {
  imageRef: RefObject<HTMLDivElement>;
  trackingRef?: RefObject<HTMLDivElement>;
  imageSrc: string;
  altText: string;
  className?: string;
  zIndex?: number;
  initialPosition?: string;
}

const ParallaxImage = ({ 
  imageRef, 
  trackingRef,
  imageSrc, 
  altText, 
  className = "",
  zIndex = 10,
  initialPosition = 'translateY(40vh) scale(0.9)' // Start from lower position
}: ParallaxImageProps) => {
  
  // Forward the ref from imageRef to trackingRef for scroll tracking
  useEffect(() => {
    if (trackingRef && imageRef.current) {
      // @ts-ignore - We're manually syncing refs for tracking purposes
      trackingRef.current = imageRef.current;
    }
  }, [trackingRef, imageRef]);

  return (
    <div 
      ref={imageRef} 
      className={`fixed inset-0 w-full h-full flex items-center justify-center transition-transform duration-700 ease-out transform-gpu ${className}`}
      style={{ 
        zIndex, // Positioned behind text
        opacity: 0,  // Start hidden
        transform: initialPosition, // Start from lower position
        willChange: "transform, opacity" // Removed filter from willChange for clearer image
      }} 
    >
      <picture>
        <source 
          type="image/webp" 
          srcSet={imageSrc.includes('75f08c75-ec0f-4cee-b3a2-db7b2ea15061') 
            ? "/optimized/astronaut-running-1200.webp 1200w, /optimized/astronaut-running.webp 1736w"
            : imageSrc
          }
          sizes="(max-width: 1200px) 1200px, 1152px"
        />
        <img 
          src={imageSrc}
          alt={altText}
          className="w-full max-w-6xl object-contain"
          style={{ filter: "none" }} // Ensure no filter is applied
          loading="lazy"
          decoding="async"
        />
      </picture>
    </div>
  );
};

export default ParallaxImage;
