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
  return <section className="pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="container-custom">
        
      </div>
    </section>;
};
export default Hero;