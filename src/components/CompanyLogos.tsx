
import { useState, useEffect, useRef } from "react";

const CompanyLogos = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, {
      threshold: 0.1
    });
    
    if (containerRef.current) {
      containerRef.current.classList.add("reveal");
      observer.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);
  
  return (
    <div ref={containerRef} className="py-12 bg-background">
      <div className="container-custom">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center opacity-70">
          <img src="/google-logo.svg" alt="Google" className="h-8 md:h-10" />
          <img src="/youtube-logo.svg" alt="YouTube" className="h-8 md:h-10" />
          <img src="/capitalg-logo.svg" alt="CapitalG" className="h-8 md:h-10" />
          <img src="/huge-logo.svg" alt="Huge" className="h-8 md:h-10" />
          <img src="/gv-logo.svg" alt="Google Ventures" className="h-8 md:h-10" />
        </div>
      </div>
    </div>
  );
};

export default CompanyLogos;
