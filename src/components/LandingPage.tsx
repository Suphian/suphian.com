
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AnimatedGreeting from "./AnimatedGreeting";
import { greetings } from "@/data/greetings";
import WavyUnderline from "./WavyUnderline";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4">
      {/* Logo in top-left corner with increased size */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10">
        <img 
          src="/lovable-uploads/e95f9219-fcb6-4a0e-bd75-7d6c2000fb1b.png" 
          alt="Suphian Logo" 
          className="h-[100px] md:h-[100px]"
        />
      </div>

      {/* Main content */}
      <div className="max-w-4xl">
        <h1 className="heading-xl mb-6 flex flex-wrap items-baseline relative">
          <AnimatedGreeting greetings={greetings} />
          <span className="ml-2 font-montserrat font-black">, I'm Suphian.</span>
          
          {/* Use the improved WavyUnderline component */}
          <WavyUnderline />
        </h1>
        
        <div className="space-y-4 text-content">
          <p className="text-xl md:text-2xl lg:text-3xl font-montserrat font-bold">
            Product Manager leading payments at YouTube.
          </p>
          
          <p className="text-xl md:text-2xl lg:text-3xl font-montserrat font-bold">
            Passionate about crafting exceptional digital experiences powered by data, design, and cutting-edge tech.
          </p>
        </div>
        
        <div className="mt-12 flex gap-4">
          <Link 
            to="/projects" 
            className="bg-youtubeRed text-primary px-6 py-3 rounded-md font-montserrat font-bold hover:bg-opacity-90 transition-all duration-300"
          >
            View My Work
          </Link>
          <Link 
            to="/contact" 
            className="border border-primary/30 text-primary px-6 py-3 rounded-md font-montserrat font-bold hover:bg-primary/10 transition-all duration-300"
          >
            Contact Me
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
