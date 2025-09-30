import { useEffect, useRef, memo } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ButtonCustom } from "./ui/button-custom";

const Hero = memo(() => {
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
      observer.disconnect();
    };
  }, []);
  return <div className="py-20 container-custom">
      
    </div>;
});

Hero.displayName = "Hero";

export default Hero;