
import React from "react";
import { Headphones } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { WaveButton } from "@/components/ui/wave-button";

interface ActionButtonsProps {
  onRequestCV: () => void;
}

const ActionButtons = ({ onRequestCV }: ActionButtonsProps) => {
  const isMobile = useIsMobile();

  // Add analytics for both buttons with console logging
  const handleRequestCV = async () => {
    console.log("🎯 Button clicked: Request CV");
    
    try {
      await window.trackEvent?.("hero_cta_click", {
        label: isMobile ? "Download CV" : "Request My Resume",
        page: window.location.pathname,
        source: "HeroSection",
        type: "request_cv",
      });
      console.log("✅ CV request event tracked successfully");
    } catch (error) {
      console.error("❌ Failed to track CV request event:", error);
    }
    
    onRequestCV();
  };

  const handleListen = async () => {
    console.log("🎯 Button clicked: Listen to Podcast");
    
    try {
      await window.trackEvent?.("hero_cta_click", {
        label: isMobile ? "Listen" : "Notebook LLM Podcast",
        page: window.location.pathname,
        source: "HeroSection",
        type: "listen_podcast",
      });
      console.log("✅ Podcast listen event tracked successfully");
    } catch (error) {
      console.error("❌ Failed to track podcast listen event:", error);
    }
  };

  return (
    <div className="flex gap-3 w-full mx-auto md:mx-0">
      <WaveButton 
        variant="secondary" 
        onClick={handleRequestCV} 
        className="flex-1 text-center"
      >
        {isMobile ? "Download CV" : "Request My Resume"}
      </WaveButton>
      
      <WaveButton variant="primary" className="flex-1">
        <a 
          href="https://notebooklm.google.com/notebook/2849175b-13a1-477d-ace3-9c3c593156a6/audio" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center justify-center whitespace-nowrap w-full h-full"
          onClick={handleListen}
        >
          <Headphones className="mr-2 h-5 w-5" />
          {isMobile ? "Listen" : "Notebook LLM Podcast"}
        </a>
      </WaveButton>
    </div>
  );
};

export default ActionButtons;
