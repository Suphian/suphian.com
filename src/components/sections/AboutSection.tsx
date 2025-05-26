
import React, { useRef } from "react";
import AstronautImage from "./AstronautImage";
import ActionButtons from "./ActionButtons";
import BioCards from "./BioCards";

interface AboutSectionProps {
  onRequestCV: () => void;
}

const AboutSection = ({ onRequestCV }: AboutSectionProps) => {
  const aboutSectionRef = useRef<HTMLDivElement>(null);

  return (
    <section id="about-section" ref={aboutSectionRef} className="mb-20">
      <div className="flex flex-col space-y-8">
        {/* Heading */}
        <h1 className="heading-xl text-balance text-left">
          Explore my story
        </h1>
        
        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content - Astronaut Image and Action Buttons */}
          <div className="relative flex flex-col space-y-4 reveal">
            <AstronautImage />
            <ActionButtons onRequestCV={onRequestCV} />
          </div>
          
          {/* Right Content - Bio Cards */}
          <div className="flex flex-col reveal" style={{ transitionDelay: "150ms" }}>            
            <BioCards />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
