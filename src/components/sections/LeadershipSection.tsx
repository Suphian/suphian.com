
import React, { useRef } from "react";

const LeadershipSection = () => {
  const leadershipSectionRef = useRef<HTMLDivElement>(null);
  
  return (
    <section id="leadership-section" ref={leadershipSectionRef} className="bg-secondary/30 p-8 md:p-12 rounded-2xl reveal mb-20">
      <h2 className="heading-lg mb-8 text-center">Leadership Philosophy</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h3 className="heading-md mb-6">My Approach</h3>
          <p className="paragraph mb-6">
            I believe in leading by example and fostering an environment where innovation can thrive.
            My approach combines technical expertise with strategic thinking to deliver products that
            make a meaningful impact on users' lives.
          </p>
          <p className="paragraph">
            Through my career, I've found that the best teams are those where everyone feels empowered
            to contribute their unique perspectives and skills. My role as a leader is to remove
            barriers, provide clear direction, and create opportunities for growth.
          </p>
        </div>
        
        <div className="bg-card p-8 rounded-xl border">
          <h3 className="heading-sm mb-6">Core Values</h3>
          <ul className="space-y-4">
            {["User-first product development", "Data-driven decision making", "Inclusive and collaborative teamwork", "Continuous learning and adaptation", "Ethical technology implementation"].map((value, index) => (
              <li key={index} className="flex items-center">
                <div className="mr-3 bg-accent/20 rounded-full p-1">
                  <svg className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default LeadershipSection;
