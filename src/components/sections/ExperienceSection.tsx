
import React from "react";

const ExperienceSection = () => {
  return (
    <section className="mb-20 reveal">
      <h2 className="heading-lg mb-12 text-center">My Experience</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
          <span className="text-accent text-sm font-medium mb-2 block">2018 - Present</span>
          <h3 className="heading-sm mb-3">YouTube & Google</h3>
          <p className="text-sm text-muted-foreground">
            Led product strategy and execution for AI-powered systems and payment solutions. 
            Developed innovative products that reduced errors, improved efficiency, and 
            enhanced user experiences.
          </p>
        </div>
        
        <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
          <span className="text-accent text-sm font-medium mb-2 block">2016 - 2018</span>
          <h3 className="heading-sm mb-3">Fintech Startups</h3>
          <p className="text-sm text-muted-foreground">
            Advised Google Ventures portfolio companies on product strategy and go-to-market 
            planning. Helped early-stage fintech startups develop scalable payment systems 
            and compliance frameworks.
          </p>
        </div>
        
        <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
          <span className="text-accent text-sm font-medium mb-2 block">2014 - 2016</span>
          <h3 className="heading-sm mb-3">Huge Inc</h3>
          <p className="text-sm text-muted-foreground">
            Started my career in growth marketing, driving digital marketing efficiency and 
            developing data-driven strategies. Achieved a 38% improvement in CPA efficiency 
            through innovative campaign optimization.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
