
import React, { useRef } from "react";
import { Headphones } from "lucide-react";
import { ButtonCustom } from "@/components/ui/button-custom";

interface AboutSectionProps {
  onRequestCV: () => void;
}

const AboutSection = ({ onRequestCV }: AboutSectionProps) => {
  const aboutSectionRef = useRef<HTMLDivElement>(null);

  return (
    <section id="about-section" ref={aboutSectionRef} className="mb-20">
      <div className="flex flex-col space-y-8">
        {/* Heading */}
        <h1 className="heading-xl text-balance text-center">
          Explore my story
        </h1>
        
        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content - Astronaut Image */}
          <div className="relative flex flex-col space-y-4 reveal">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
              <img src="/lovable-uploads/24178ae2-7999-4f91-9a29-81fbe5a02753.png" alt="Astronaut wearing red headphones" className="w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-transparent" />
            </div>
            
            {/* Button below astronaut image */}
            <div>
              <ButtonCustom variant="outline" onClick={onRequestCV} className="w-full">
                Request My CV
              </ButtonCustom>
            </div>
          </div>
          
          {/* Right Content - Description */}
          <div className="flex flex-col space-y-6 reveal" style={{
            transitionDelay: "150ms"
          }}>
            <p className="paragraph">
              Listen to a short podcast about my experience and ask questions in real time.
            </p>
            
            <div className="pt-4">
              <ButtonCustom size="lg" arrowIcon className="w-full">
                <a href="https://notebooklm.google.com/notebook/2849175b-13a1-477d-ace3-9c3c593156a6/audio" target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <Headphones className="mr-2 h-5 w-5" />
                  Launch Notebook LLM
                </a>
              </ButtonCustom>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
