
import React from "react";
import AboutSection from "./AboutSection";
import ExperienceSection from "./ExperienceSection";

interface ContentSectionProps {
  onRequestCV: () => void;
  onContactClick: () => void;
}

const ContentSection = ({ onRequestCV, onContactClick }: ContentSectionProps) => {
  return (
    <div className="pt-20 pb-24">
      <div className="container-custom">
        <AboutSection onRequestCV={onRequestCV} />
        
        {/* Added relative and overflow-hidden to support the fade transition effect */}
        <div className="relative overflow-hidden">
          <ExperienceSection />
        </div>
      </div>
    </div>
  );
};

export default ContentSection;
