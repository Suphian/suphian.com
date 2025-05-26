
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { WaveButton } from "@/components/ui/wave-button";
import ContactSheet from "./ContactSheet";

const CallToAction = () => {
  const location = useLocation();
  const [contactOpen, setContactOpen] = useState(false);
  const isMobile = useIsMobile();

  const scrollToProjects = (e: React.MouseEvent) => {
    e.preventDefault();
    const contentSection = document.getElementById("content-section");
    if (contentSection) {
      window.scrollTo({
        top: contentSection.offsetTop - 50,
        behavior: "smooth"
      });
      
      window.dispatchEvent(new Event('startButtonClicked'));
    }
  };

  return (
    <>
      <div className="mt-12 flex gap-4">
        <WaveButton
          variant="youtube"
          size="lg"
          onClick={scrollToProjects}
          className="w-full sm:w-56 text-center"
        >
          {isMobile ? "Start" : "Start Here"}
        </WaveButton>
      </div>

      <ContactSheet open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
};

export default CallToAction;
