
import React, { useRef } from "react";
import { Headphones } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ButtonCustom } from "@/components/ui/button-custom";
import { Card, CardContent } from "@/components/ui/card";

interface AboutSectionProps {
  onRequestCV: () => void;
}

const AboutSection = ({ onRequestCV }: AboutSectionProps) => {
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  return (
    <section id="about-section" ref={aboutSectionRef} className="mb-20">
      <div className="flex flex-col space-y-8">
        {/* Heading - Moved to left */}
        <h1 className="heading-xl text-balance text-left">
          Explore my story
        </h1>
        
        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content - Bigger Astronaut Image */}
          <div className="relative flex flex-col space-y-4 reveal">
            <div className="aspect-square w-full mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-lg bg-background">
              <img src="/lovable-uploads/9ecd33bc-76a0-4af2-a18c-c988cab8c7e9.png" alt="Astronaut wearing orange headphones" className="w-full h-full object-contain object-center" />
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-transparent" />
            </div>
            
            {/* Two buttons side by side below astronaut image with wave animation */}
            <div className="flex gap-3 w-full mx-auto md:mx-0">
              <button 
                onClick={onRequestCV} 
                className="wave-btn flex-1 bg-secondary text-foreground px-4 py-2 rounded-md font-montserrat font-bold transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10 group-hover:text-background transition-colors duration-300">
                  {isMobile ? "Download CV" : "Request My Resume"}
                </span>
                <span className="absolute inset-0 bg-accent bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
              </button>
              
              <button className="wave-btn flex-1 bg-primary text-background px-4 py-2 rounded-md font-montserrat font-bold transition-all duration-300 relative overflow-hidden group">
                <a 
                  href="https://notebooklm.google.com/notebook/2849175b-13a1-477d-ace3-9c3c593156a6/audio" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center whitespace-nowrap relative z-10 group-hover:text-primary-foreground transition-colors duration-300"
                >
                  <Headphones className="mr-2 h-5 w-5" />
                  {isMobile ? "Listen" : "Notebook LLM Podcast"}
                </a>
                <span className="absolute inset-0 bg-youtubeRed bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
              </button>
            </div>
          </div>
          
          {/* Right Content - Bio with styled paragraphs */}
          <div className="flex flex-col reveal" style={{
            transitionDelay: "150ms"
          }}>            
            {/* Bio paragraphs with styled cards - reduced space between cards */}
            <div className="space-y-1">
              <Card className="bg-background border-0 overflow-hidden relative">
                <CardContent className="p-4 sm:p-5">
                  <p className="paragraph">
                    I grew up between cultures — the kind of upbringing that teaches you to listen deeply, challenge assumptions, and speak multiple languages (including internet). I've spent my career working with founders, private equity, and corporate 9-to-5ers who want to do more than just ship — they want to shake things up.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-background border-0 overflow-hidden relative">
                <CardContent className="p-4 sm:p-5">
                  <p className="paragraph">
                    I think data science and AI aren't just the future — they're the foundation. I'm wired for first principles, allergic to fluff, and always looking for people who are smart, egoless, and unafraid to be wrong.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-background border-0 overflow-hidden relative">
                <CardContent className="p-4 sm:p-5">
                  <p className="paragraph">
                    My work spans e-commerce, consumer apps, and internal tools — often the kinds of products that challenge business-as-usual and deliver a smarter, more human way of doing things. What ties it all together is a singular goal: helping ambitious teams think bigger.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-background border-0 overflow-hidden relative">
                <CardContent className="p-4 sm:p-5">
                  <p className="paragraph">
                    Technology is going to remake everything — faster than most are ready for. But with the right mindset and a bias for clarity, we can build a future that's big enough for everyone.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
