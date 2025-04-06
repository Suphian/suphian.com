
import { RefObject } from "react";

interface ParallaxImageProps {
  imageRef: RefObject<HTMLDivElement>;
  imageSrc: string;
  altText: string;
  className?: string;
}

const ParallaxImage = ({ imageRef, imageSrc, altText, className = "" }: ParallaxImageProps) => {
  return (
    <div 
      ref={imageRef} 
      className={`fixed inset-0 w-full h-full flex items-center justify-center transition-transform duration-700 ease-out transform-gpu ${className}`}
      style={{ 
        zIndex: 10, // Lower z-index to position behind text
        opacity: 0,  // Start hidden
        transform: 'translateY(30vh) scale(0.9)' // Start from below
      }} 
    >
      <img 
        src={imageSrc}
        alt={altText}
        className="w-full max-w-6xl object-contain"
      />
    </div>
  );
};

export default ParallaxImage;
