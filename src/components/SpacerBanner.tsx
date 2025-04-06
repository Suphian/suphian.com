
import React from "react";

interface SpacerBannerProps {
  imageUrl: string;
}

const SpacerBanner: React.FC<SpacerBannerProps> = ({ imageUrl }) => {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-black relative overflow-hidden">
      <div className="max-w-5xl w-full mx-auto px-4">
        <img 
          src={imageUrl} 
          alt="Suph logo with astronaut" 
          className="w-full max-w-3xl mx-auto object-contain reveal"
          style={{ 
            maxHeight: "80vh"
          }}
        />
      </div>
    </div>
  );
};

export default SpacerBanner;
