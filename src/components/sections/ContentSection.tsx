
import React from "react";
import AboutSection from "./AboutSection";
import ExperienceSection from "./ExperienceSection";

interface ContentSectionProps {
  onRequestCV: () => void;
  onContactClick: () => void;
  aboutSectionRef?: React.RefObject<HTMLDivElement>;
  experienceSectionRef?: React.RefObject<HTMLDivElement>;
}

const ContentSection = ({ 
  onRequestCV, 
  onContactClick, 
  aboutSectionRef, 
  experienceSectionRef 
}: ContentSectionProps) => {
  return (
    <div className="pt-20 pb-24">
      <div className="container-custom">
        <AboutSection 
          onRequestCV={onRequestCV} 
          ref={aboutSectionRef}
        />
        
        {/* Added relative and overflow-hidden to support the fade transition effect */}
        <div className="relative overflow-hidden">
          <ExperienceSection ref={experienceSectionRef} />
        </div>
      </div>
    </div>
  );
};

export default ContentSection;
