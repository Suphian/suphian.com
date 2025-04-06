
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
        
        {/* Right Content - Updated Astronaut Image */}
        <div className="relative flex flex-col space-y-4 order-first md:order-last reveal" style={{
          transitionDelay: "150ms"
        }}>
          <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
            <img src="/lovable-uploads/24178ae2-7999-4f91-9a29-81fbe5a02753.png" alt="Astronaut wearing red headphones" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-transparent" />
          </div>
          
          {/* Buttons below astronaut image */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <ButtonCustom variant="default" onClick={onRequestCV} className="w-full sm:w-auto">
              Request CV
            </ButtonCustom>
            
            <ButtonCustom variant="outline" className="w-full sm:w-auto">
              <a 
                href="https://notebooklm.google.com/notebook/2849175b-13a1-477d-ace3-9c3c593156a6/audio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <Headphones className="mr-2 h-5 w-5" />
                Listen to NotebookLM Podcast
              </a>
            </ButtonCustom>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
