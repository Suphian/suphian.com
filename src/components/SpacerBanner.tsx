
import React from "react";

interface SpacerBannerProps {
  imageUrl: string;
}

const SpacerBanner: React.FC<SpacerBannerProps> = ({ imageUrl }) => {
  return (
    <div 
      className="w-full bg-black relative overflow-hidden -mt-20"
      style={{ height: "50vh" }} // Increased height for better visual impact
    >
      {/* Full-size image with no padding */}
      <img 
        src={imageUrl}
        alt="SUPH design visual" 
        className="w-full h-full object-cover object-center"
        style={{ 
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
    </div>
  );
};

export default SpacerBanner;
