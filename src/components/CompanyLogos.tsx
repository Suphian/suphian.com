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
  return <section className="py-16 border-t border-border/60">
      <div className="container-custom">
        <div ref={containerRef}>
          <h2 className="heading-sm text-center text-muted-foreground mb-12">
            Companies I've worked with
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-items-center">
            <div className="w-32 h-16 md:w-40 md:h-20 flex items-center justify-center grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <img src="/youtube-logo.svg" alt="YouTube logo" className="max-w-full max-h-full" />
            </div>
            <div className="w-32 h-16 md:w-40 md:h-20 flex items-center justify-center grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <img src="/google-logo.svg" alt="Google logo" className="max-w-full max-h-full" />
            </div>
            
            <div className="w-32 h-16 md:w-40 md:h-20 flex items-center justify-center grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <img src="/huge-logo.svg" alt="Huge Inc logo" className="max-w-full max-h-full" />
            </div>
            <div className="w-32 h-16 md:w-40 md:h-20 flex items-center justify-center grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <img src="/capitalg-logo.svg" alt="CapitalG logo" className="max-w-full max-h-full" />
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default CompanyLogos;