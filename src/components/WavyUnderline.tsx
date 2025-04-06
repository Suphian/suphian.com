
import React from "react";

const WavyUnderline = () => {
  return (
    <div className="absolute bottom-[-8px] left-0 w-full">
      <svg width="100%" height="8" className="overflow-visible">
        <path 
         d="M0,2 Q50,5 100,2 T200,2 T300,2 T400,2 T500,2 T600,2 T700,2 T800,2 T900,2 T1000,2 T1100,2 T1200,2 T1300,2 T1400,2 T1500,2"
          fill="none" 
          stroke="#FF3B30" 
          strokeWidth="3" 
          strokeLinecap="round"
          strokeLinejoin="round"
          className="wavy-underline"
        />
      </svg>
    </div>
  );
};

export default WavyUnderline;
