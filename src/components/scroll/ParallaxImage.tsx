
import { RefObject } from "react";

interface ParallaxImageProps {
  imageRef?: RefObject<HTMLDivElement>;
  imageSrc: string;
  altText?: string;
  className?: string;
  zIndex?: number;
  initialPosition?: string;
  speed?: number;
  direction?: "up" | "down" | "left" | "right";
}

const ParallaxImage = ({ 
  imageRef, 
  imageSrc, 
  altText = "Parallax image", 
  className = "",
  zIndex = 10,
  initialPosition = 'translateY(40vh) scale(0.9)', // Start from lower position
  speed = 0.5,
  direction = "down"
}: ParallaxImageProps) => {
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
      data-speed={speed}
      data-direction={direction}
    >
      <img 
        src={imageSrc}
        alt={altText}
        className="w-full max-w-6xl object-contain"
        style={{ filter: "none" }} // Ensure no filter is applied
      />
    </div>
  );
};

export default ParallaxImage;
