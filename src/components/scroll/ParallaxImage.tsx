
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
      className={`fixed inset-0 w-full h-full flex items-center justify-center transition-all duration-500 ease-out transform-gpu ${className}`}
      style={{ zIndex: 20, opacity: 0 }} // Start hidden
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
