
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AnimatedGreeting from "./AnimatedGreeting";
import { greetings } from "@/data/greetings";
import CallToAction from "./CallToAction";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-gradient-to-b from-background to-transparent">
      {/* Main content with enhanced backdrop for better text visibility against the sliding image */}
      <div className="max-w-4xl relative z-20">
        <div className="backdrop-blur-sm bg-background/50 rounded-xl p-6 md:p-8 shadow-xl">
          <h1 className="heading-xl mb-6 flex flex-wrap items-baseline relative text-white">
            <span className="relative inline-block">
              <AnimatedGreeting greetings={greetings} />
              <span className="ml-2 font-montserrat font-black">, I'm Suphian.</span>
            </span>
          </h1>
          
          <div className="space-y-4">
            <p className="text-xl md:text-2xl lg:text-3xl font-montserrat font-bold text-white">
              Product Manager leading payments at YouTube. Passionate about crafting exceptional experiences powered by data, design, and cutting-edge tech.
            </p>
          </div>
          
          <CallToAction />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
