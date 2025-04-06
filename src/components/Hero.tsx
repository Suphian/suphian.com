
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ButtonCustom } from "./ui/button-custom";

const Hero = () => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

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
        <div className="flex justify-center items-center">
          <img 
            src="/lovable-uploads/d847628a-13e4-46ae-8c3c-b0892222a5b9.png" 
            alt="SUPH branding" 
            className="h-[200px] md:h-[250px] opacity-30 absolute"
            style={{ pointerEvents: "none" }}
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
