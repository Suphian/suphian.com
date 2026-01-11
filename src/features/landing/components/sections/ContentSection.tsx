
import { type RefObject } from "react";
import AboutSection from "./AboutSection";
import ExperienceSection from "./ExperienceSection";

interface ContentSectionProps {
  onRequestCV: () => void;
  onContactClick: () => void;
  aboutSectionRef?: RefObject<HTMLDivElement>;
  experienceSectionRef?: RefObject<HTMLDivElement>;
}

const ContentSection = ({
  onRequestCV,
  onContactClick: _onContactClick,
  aboutSectionRef,
  experienceSectionRef
}: ContentSectionProps) => {
  return (
    <div className="pt-0 pb-12">
      <div className="container-custom">
        <AboutSection 
          onRequestCV={onRequestCV} 
          ref={aboutSectionRef}
        />
        
        <ExperienceSection ref={experienceSectionRef} />
      </div>
    </div>
  );
};

export default ContentSection;
