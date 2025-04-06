
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AnimatedGreeting from "./AnimatedGreeting";
import { greetings } from "@/data/greetings";
import Logo from "./Logo";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4">
      {/* Logo component */}
      <Logo />

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
