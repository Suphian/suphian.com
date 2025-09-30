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
  return (
    <div className="py-20 container-custom">
      <div className="text-center max-w-4xl mx-auto space-y-6">
        <h2 className="text-4xl md:text-5xl font-bold text-white">
          Building the Future of Payments
        </h2>
        <p className="text-xl text-white/80">
          Leading product strategy at YouTube, where I drive innovation in payment systems and creator monetization.
        </p>
      </div>
    </div>
  );
});

Hero.displayName = "Hero";

export default Hero;