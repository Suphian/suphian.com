
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Mic } from "lucide-react";
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

  const playPronunciation = async () => {
    try {
      const audio = new Audio('https://sofyan.com/audio/suphian_pronunciation.mp3');
      await audio.play();
      
      // Track the pronunciation button click
      await window.trackEvent?.("pronunciation_click", {
        label: "Hear Suphian pronunciation",
        page: window.location.pathname,
        source: "LandingPage",
        type: "audio_playback",
      });
    } catch (error) {
      console.error("Failed to play pronunciation audio:", error);
    }
  };

  return (
    <>
      <div className="mt-12 flex gap-3 justify-start">
        <WaveButton
          variant="youtube"
          size="lg"
          onClick={scrollToProjects}
          className="flex-1 sm:flex-none sm:w-56 text-center"
        >
          {isMobile ? "Start" : "Start Here"}
        </WaveButton>
        
        <WaveButton
          variant="youtube"
          size="lg"
          onClick={playPronunciation}
          className="flex-1 sm:flex-none sm:w-auto text-center"
          aria-label="Hear how to pronounce Suphian"
        >
          <Mic className="h-4 w-4 mr-2" />
          {isMobile ? "how to say" : "how to say"}
        </WaveButton>
      </div>

      <ContactSheet open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
};

export default CallToAction;
