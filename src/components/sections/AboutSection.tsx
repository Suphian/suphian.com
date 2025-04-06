
import React, { useRef } from "react";
import { Headphones } from "lucide-react";
import { ButtonCustom } from "@/components/ui/button-custom";
import { Card, CardContent } from "@/components/ui/card";

interface AboutSectionProps {
  onRequestCV: () => void;
}

const AboutSection = ({ onRequestCV }: AboutSectionProps) => {
  const aboutSectionRef = useRef<HTMLDivElement>(null);

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
              <img src="/lovable-uploads/46e934f3-cd5e-4751-ba02-c7fe6d5f16cc.png" alt="Astronaut wearing red headphones" className="w-full h-full object-contain object-center" />
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-transparent" />
            </div>
            
            {/* Two buttons side by side below astronaut image with wave animation */}
            <div className="flex gap-3 w-full mx-auto md:mx-0">
              <ButtonCustom 
                variant="outline" 
                onClick={onRequestCV} 
                className="wave-btn flex-1"
              >
                Request My Resume
              </ButtonCustom>
              
              <ButtonCustom 
                variant="default" 
                className="wave-btn flex-1"
              >
                <a 
                  href="https://notebooklm.google.com/notebook/2849175b-13a1-477d-ace3-9c3c593156a6/audio" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center whitespace-nowrap"
                >
                  <Headphones className="mr-2 h-5 w-5" />
                  Notebook LLM Podcast
                </a>
              </ButtonCustom>
            </div>
          </div>
          
          {/* Right Content - Bio with styled paragraphs */}
          <div className="flex flex-col space-y-6 reveal" style={{
            transitionDelay: "150ms"
          }}>            
            {/* Bio paragraphs with styled cards */}
            <div className="space-y-4">
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
