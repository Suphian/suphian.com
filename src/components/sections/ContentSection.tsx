
import React from "react";
import AboutSection from "./AboutSection";
import ExperienceSection from "./ExperienceSection";
import LeadershipSection from "./LeadershipSection";
import ContactSection from "./ContactSection";

interface ContentSectionProps {
  onRequestCV: () => void;
  onContactClick: () => void;
}

const ContentSection = ({ onRequestCV, onContactClick }: ContentSectionProps) => {
  return (
    <div className="pt-20 pb-24">
      <div className="container-custom">
        <AboutSection onRequestCV={onRequestCV} />
        <ExperienceSection />
        <LeadershipSection />
        <ContactSection onContactClick={onContactClick} />
      </div>
    </div>
  );
};

export default ContentSection;
