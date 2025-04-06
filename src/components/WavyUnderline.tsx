
import React from "react";

const WavyUnderline = () => {
  return (
    <div className="absolute bottom-[-8px] left-0 w-full overflow-hidden z-0">
      <svg width="100%" height="10" className="overflow-visible">
        <path 
          d="M0,2 Q5,5 10,2 T20,2 T30,2 T40,2 T50,2 T60,2 T70,2 T80,2 T90,2 T100,2"
          fill="none" 
          stroke="#FF3B30" 
          strokeWidth="3" 
          strokeLinecap="round"
          strokeLinejoin="round"
          className="wavy-underline"
          vectorEffect="non-scaling-stroke"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset="100"
        />
      </svg>
    </div>
  );
};

export default WavyUnderline;
