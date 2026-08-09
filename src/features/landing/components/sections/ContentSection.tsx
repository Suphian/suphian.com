
import { type RefObject } from "react";
import AboutSection from "./AboutSection";
import ExperienceSection from "./ExperienceSection";
import ProjectsSection from "./ProjectsSection";

interface ContentSectionProps {
  onRequestCV: () => void;
  aboutSectionRef?: RefObject<HTMLDivElement>;
  experienceSectionRef?: RefObject<HTMLDivElement>;
  projectsSectionRef?: RefObject<HTMLDivElement>;
}

const ContentSection = ({
  onRequestCV,
  aboutSectionRef,
  experienceSectionRef,
  projectsSectionRef
}: ContentSectionProps) => {
  return (
    <div className="pt-0 pb-12">
      <div className="container-custom">
        <AboutSection
          onRequestCV={onRequestCV}
          ref={aboutSectionRef}
        />

        <ExperienceSection ref={experienceSectionRef} />

        <ProjectsSection ref={projectsSectionRef} />
      </div>
    </div>
  );
};

export default ContentSection;
