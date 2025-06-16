
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { WaveButton } from "@/components/ui/wave-button";
import ContactSheet from "./ContactSheet";

const CallToAction = () => {
  const location = useLocation();
  const [contactOpen, setContactOpen] = useState(false);
  const isMobile = useIsMobile();

  const scrollToProjects = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("🎯 Button clicked: Start Here");
    
    try {
      await window.trackEvent?.("landing_cta_click", {
        label: isMobile ? "Start" : "Start Here",
        page: window.location.pathname,
        source: "LandingPage",
        type: "scroll_to_content",
      });
      console.log("✅ Start Here event tracked successfully");
    } catch (error) {
      console.error("❌ Failed to track start here event:", error);
    }
    
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
