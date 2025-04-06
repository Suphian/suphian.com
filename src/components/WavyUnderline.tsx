
import React from "react";

const WavyUnderline = () => {
  return (
    <div className="absolute bottom-[-8px] left-0 w-full">
      <svg width="100%" height="8" className="overflow-visible">
        <path 
          d="M0,2 Q30,5 60,2 T120,2 T180,2 T240,2 T300,2 T360,2 T420,2 T480,2 T540,2" 
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
