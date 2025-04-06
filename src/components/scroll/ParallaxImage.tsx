
import { RefObject } from "react";

interface ParallaxImageProps {
  imageRef: RefObject<HTMLDivElement>;
  imageSrc: string;
  altText: string;
}

const ParallaxImage = ({ imageRef, imageSrc, altText }: ParallaxImageProps) => {
  return (
    <div 
      ref={imageRef} 
      className="absolute inset-0 w-full h-full flex items-center justify-center transition-transform duration-300 ease-out transform-gpu"
      style={{ zIndex: 20 }}
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
