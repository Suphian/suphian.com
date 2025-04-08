
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
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
    <div className="py-20 container-custom">
      <div className="flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="w-full md:w-1/2">
          <p className="paragraph mb-8">
            Explore my portfolio and discover my work in product management and technology.
          </p>
          <div ref={buttonsRef} className="flex flex-wrap gap-4">
            <ButtonCustom variant="default">Learn More</ButtonCustom>
            <ButtonCustom variant="outline">
              <Link to="/contact" className="flex items-center">
                <span>Contact Me</span>
              </Link>
            </ButtonCustom>
          </div>
        </div>
        <div ref={imageRef} className="w-full md:w-1/2">
          <div className="relative">
            <img 
              src="/lovable-uploads/9ecd33bc-76a0-4af2-a18c-c988cab8c7e9.png" 
              alt="Hero Image" 
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
