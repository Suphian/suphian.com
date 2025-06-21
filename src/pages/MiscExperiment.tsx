
import React, { useState, useEffect } from "react";
import { StreamingRevenueWidget } from "@/components/StreamingRevenueWidget";

const MiscExperiment = () => {
  return (
    <div className="container-custom py-20">
      <div className="max-w-6xl mx-auto">
        <h1 className="heading-xl text-center mb-8">
          Music Lab
        </h1>
        <p className="paragraph text-center mb-12">
          Explore the economics of music streaming with our interactive revenue calculator.
        </p>
        
        <StreamingRevenueWidget />
      </div>
    </div>
  );
};

export default MiscExperiment;
