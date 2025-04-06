
import React from "react";
import { greetings } from "../data/greetings";
import AnimatedGreeting from "./AnimatedGreeting";
import WavyUnderline from "./WavyUnderline";
import Logo from "./Logo";
import CallToAction from "./CallToAction";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4">
      {/* Logo in top-left corner */}
      <Logo />

      {/* Main content */}
      <div className="max-w-4xl">
        <h1 className="heading-xl mb-6 flex flex-wrap items-baseline relative">
          <AnimatedGreeting greetings={greetings} />
          <span className="ml-2 font-montserrat font-black">, I'm Suphian.</span>
          <WavyUnderline />
        </h1>
        
        <div className="space-y-4 text-content">
          <p className="text-xl md:text-2xl lg:text-3xl font-montserrat font-bold">
            Product Manager leading payments at YouTube.
          </p>
          
          <p className="text-xl md:text-2xl lg:text-3xl font-montserrat font-bold">
            Previously redesigned digital experiences for Hulu, Apple, Duolingo, and Chewy.com—passionate about crafting elegant, data-driven products powered by thoughtful design and cutting-edge AI.
          </p>
        </div>
        
        <CallToAction />
      </div>
    </div>
  );
};

export default LandingPage;
