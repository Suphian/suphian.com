import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Headphones } from "lucide-react";
import { ButtonCustom } from "./ui/button-custom";

const Hero = () => {
  const buttonsRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const elements = [buttonsRef.current, imageRef.current];
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
          {/* Buttons section preserved */}
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
          {/* Image placeholder preserved */}
        </div>
      </div>
    </section>
  );
};

export default Hero;
