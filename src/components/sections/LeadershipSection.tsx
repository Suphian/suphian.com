
import React, { useRef } from "react";
import { ButtonCustom } from "@/components/ui/button-custom";

const LeadershipSection = () => {
  const leadershipSectionRef = useRef<HTMLDivElement>(null);
  
  return (
    <section ref={leadershipSectionRef} className="py-24 md:py-32 bg-secondary/30">
      <div className="container-custom">
        <div className="text-center mb-16 reveal">
          <span className="tag mb-4">Leadership</span>
          <h2 className="heading-xl mb-6">Driving Innovation</h2>
          <p className="paragraph max-w-2xl mx-auto">
            Leading teams to develop cutting-edge solutions in AI and payment technologies.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 reveal-stagger">
          {/* Leadership cards can be added here */}
        </div>
      </div>
    </section>
  );
};

export default LeadershipSection;
