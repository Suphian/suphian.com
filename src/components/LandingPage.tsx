
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AnimatedGreeting from "./AnimatedGreeting";
import { greetings } from "@/data/greetings";
import CallToAction from "./CallToAction";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4">
      {/* Main content */}
      <div className="max-w-4xl">
        <h1 className="heading-xl mb-6 flex flex-wrap items-baseline relative">
          <span className="relative inline-block">
            <AnimatedGreeting greetings={greetings} />
            <span className="ml-2 font-montserrat font-black">, I'm Suphian.</span>
          </span>
        </h1>
        
        <div className="space-y-4 text-content">
          <p className="text-xl md:text-2xl lg:text-3xl font-montserrat font-bold">
            Product Manager leading payments at YouTube. Passionate about crafting exceptional experiences powered by data, design, and cutting-edge tech.
          </p>
        </div>
        
        <CallToAction />
      </div>
    </div>
  );
};

export default LandingPage;
