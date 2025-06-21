
import React, { useState, useEffect } from "react";
import { StreamingRevenueWidget } from "@/components/StreamingRevenueWidget";
import { YouTubeMusicPlayer } from "@/components/YouTubeMusicPlayer";

const MiscExperiment = () => {
  return (
    <div className="container-custom py-20">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="heading-xl mb-8">
            Music Experiment
          </h1>
          <p className="paragraph mb-12">
            Explore the economics of music streaming with our interactive revenue calculator and enjoy music with our YouTube player.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <YouTubeMusicPlayer />
          <div className="lg:col-span-1">
            <StreamingRevenueWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiscExperiment;
