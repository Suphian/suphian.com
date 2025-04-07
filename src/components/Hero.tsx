
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Headphones } from "lucide-react";
import { ButtonCustom } from "./ui/button-custom";

const Hero = () => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const elements = [headingRef.current, paragraphRef.current, buttonsRef.current, imageRef.current];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, {
      threshold: 0.1
    });
    elements.forEach(el => {
      if (el) {
        el.classList.add("reveal");
        observer.observe(el);
      }
    });
    return () => {
      elements.forEach(el => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="container-custom">
        <div className="flex flex-col space-y-8 max-w-4xl">
          <h1 ref={headingRef} className="heading-xl text-balance mb-4">
            Welcome to my portfolio
          </h1>
          
          <p ref={paragraphRef} className="paragraph text-lg md:text-xl mb-6">
            Product Manager leading payments at YouTube. Passionate about crafting exceptional experiences powered by data, design, and cutting-edge tech.
          </p>
          
          {/* Mobile-friendly buttons */}
          <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4">
            <ButtonCustom 
              variant="outline" 
              className="wave-btn w-full sm:w-auto"
            >
              {isMobile ? "Download CV" : "Request My Resume"}
            </ButtonCustom>
            
            <ButtonCustom 
              variant="default" 
              className="wave-btn w-full sm:w-auto"
            >
              <a 
                href="https://notebooklm.google.com/notebook/2849175b-13a1-477d-ace3-9c3c593156a6/audio" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center whitespace-nowrap"
              >
                <Headphones className="mr-2 h-5 w-5" />
                {isMobile ? "Listen" : "Notebook LLM Podcast"}
              </a>
            </ButtonCustom>
          </div>
        </div>
        
        <div ref={imageRef} className="mt-12">
          {/* You can add a hero image here if needed */}
        </div>
      </div>
    </section>
  );
};

export default Hero;
