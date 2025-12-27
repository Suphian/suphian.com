
import React, { memo, useCallback } from "react";
import { Headphones } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/shared/hooks/use-mobile";

interface ActionButtonsProps {
  onRequestCV: () => void;
}

const ActionButtons = memo(({ onRequestCV }: ActionButtonsProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Add analytics for both buttons
  const handleRequestCV = useCallback(async () => {
    
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
  }, [isMobile, onRequestCV]);

  const handleListen = useCallback(async () => {
    try {
      await window.trackEvent?.("hero_cta_click", {
        label: isMobile ? "Listen" : "Notebook LLM Podcast",
        page: window.location.pathname,
        source: "HeroSection",
        type: "listen_podcast",
      });
    } catch (error) {
      console.error("❌ Failed to track podcast listen event:", error);
    }
    
    navigate('/podcast');
  }, [isMobile, navigate]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <button
        onClick={handleRequestCV}
        className="text-xs font-mono px-6 py-3 border transition-all text-center"
        style={{ 
          color: '#FF3B30',
          borderColor: '#FF3B30',
          backgroundColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {isMobile ? "Download CV" : "Request My Resume"}
      </button>
      
      <button
        onClick={handleListen}
        className="text-xs font-mono px-6 py-3 border transition-all text-center flex items-center justify-center gap-2"
        style={{ 
          color: '#FF3B30',
          borderColor: '#FF3B30',
          backgroundColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Headphones className="h-4 w-4" />
        <span>{isMobile ? "Listen" : "Notebook LLM Podcast"}</span>
      </button>
    </div>
  );
});

ActionButtons.displayName = "ActionButtons";

export default ActionButtons;
