
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="flex flex-col space-y-6 reveal">
          <h1 className="heading-xl text-balance">
            Explore my story
          </h1>
          
          <p className="paragraph">
            Listen to a short podcast about my experience and ask questions in real time.
          </p>
          
          <div className="pt-4 flex flex-col space-y-6">
            <ButtonCustom size="lg" arrowIcon>
              <a href="https://notebooklm.google.com/notebook/2849175b-13a1-477d-ace3-9c3c593156a6/audio" target="_blank" rel="noopener noreferrer" className="flex items-center">
                <Headphones className="mr-2 h-5 w-5" />
                Launch Notebook LLM
              </a>
            </ButtonCustom>
            
            <div className="flex items-center text-muted-foreground">
              <span>Currently located in New York City</span>
            </div>
            
            <div>
              <ButtonCustom variant="outline" onClick={onRequestCV}>
                Request My CV
              </ButtonCustom>
            </div>
          </div>
        </div>
        
        {/* Right Content - Astronaut Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg order-first md:order-last reveal" style={{
          transitionDelay: "150ms"
        }}>
          <img src="/lovable-uploads/6fbb55f2-ad2f-4646-9f3a-382f1ffc8c31.png" alt="Astronaut wearing headphones" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
