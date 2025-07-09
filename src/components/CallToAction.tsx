
import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { WaveButton } from "@/components/ui/wave-button";
import ContactSheet from "./ContactSheet";

const CallToAction = () => {
  const location = useLocation();
  const [contactOpen, setContactOpen] = useState(false);
  const isMobile = useIsMobile();
  const lastAudioPlayRef = useRef<number>(0);
  const hasUserInteractedRef = useRef<boolean>(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const playPronunciation = async (source = "unknown") => {
    const now = Date.now();
    if (now - lastAudioPlayRef.current < 60000) {
      console.log("Audio throttled - played within last minute");
      return; // Skip if audio was played within last 1 minute
    }
    
    // For mobile hover events, only play if user has already interacted with audio
    if (source === "hover" && isMobile && !hasUserInteractedRef.current) {
      console.log("Mobile hover audio blocked - no prior user interaction");
      return;
    }
    
    try {
      console.log("Playing pronunciation audio from:", source);
      const audio = new Audio('/suphian-pronunciation.wav');
      
      // Set volume to ensure it's audible
      audio.volume = 0.8;
      
      await audio.play();
      lastAudioPlayRef.current = now;
      hasUserInteractedRef.current = true; // Mark that user has interacted
      
      // Track the pronunciation audio play
      await window.trackEvent?.("pronunciation_play", {
        label: "Hear Suphian pronunciation",
        page: window.location.pathname,
        source: "LandingPage",
        type: "audio_playback",
        trigger: source
      });
    } catch (error) {
      console.error("Failed to play pronunciation audio:", error);
      if (error.name === 'NotAllowedError') {
        console.error("Audio blocked by browser - user interaction required");
      }
    }
  };

  const handleStartButtonAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("🎯 Button clicked: Start Here");
    
    // Clear hover timeout since user clicked
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Play pronunciation audio
    await playPronunciation("click");
    
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
    
    scrollToContent();
  };

  const scrollToContent = () => {
    const contentSection = document.getElementById("content-section");
    if (contentSection) {
      window.scrollTo({
        top: contentSection.offsetTop - 50,
        behavior: "smooth"
      });
      
      window.dispatchEvent(new Event('startButtonClicked'));
    }
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    
    // Play pronunciation audio
    playPronunciation("hover");
    
    // Set timeout for auto-scroll after animation duration (2s)
    hoverTimeoutRef.current = setTimeout(async () => {
      console.log("🎯 Auto-scrolling from hover timeout");
      
      try {
        await window.trackEvent?.("landing_cta_hover_auto_scroll", {
          label: "Auto scroll from hover",
          page: window.location.pathname,
          source: "LandingPage",
          type: "auto_scroll_to_content",
        });
      } catch (error) {
        console.error("❌ Failed to track hover auto-scroll event:", error);
      }
      
      scrollToContent();
    }, 2000); // 2 seconds to let user fully experience the hover effect
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    
    // Clear the hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  return (
    <>
      <div className="mt-12 flex gap-3 justify-start">
        <WaveButton
          variant="youtube"
          size="lg"
          onClick={handleStartButtonAction}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="flex-1 sm:flex-none sm:w-56 text-center group relative"
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-1 mr-3">
              <div className="w-1 h-3 bg-current rounded-full opacity-60 group-hover:animate-pulse group-hover:opacity-100 transition-all duration-200"></div>
              <div className="w-1 h-4 bg-current rounded-full opacity-60 group-hover:animate-pulse group-hover:opacity-100 transition-all duration-200" style={{animationDelay: '0.1s'}}></div>
              <div className="w-1 h-2 bg-current rounded-full opacity-60 group-hover:animate-pulse group-hover:opacity-100 transition-all duration-200" style={{animationDelay: '0.2s'}}></div>
              <div className="w-1 h-5 bg-current rounded-full opacity-60 group-hover:animate-pulse group-hover:opacity-100 transition-all duration-200" style={{animationDelay: '0.3s'}}></div>
              <div className="w-1 h-3 bg-current rounded-full opacity-60 group-hover:animate-pulse group-hover:opacity-100 transition-all duration-200" style={{animationDelay: '0.4s'}}></div>
            </div>
            {isMobile ? "Start" : "Start Here"}
          </div>
        </WaveButton>
      </div>

      <ContactSheet open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
};

export default CallToAction;
