
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

  const playPronunciation = async () => {
    const now = Date.now();
    if (now - lastAudioPlayRef.current < 60000) {
      return; // Skip if audio was played within last 1 minute
    }
    
    try {
      const audio = new Audio('/suphian-pronunciation.m4a');
      await audio.play();
      lastAudioPlayRef.current = now;
      
      // Track the pronunciation audio play
      await window.trackEvent?.("pronunciation_play", {
        label: "Hear Suphian pronunciation",
        page: window.location.pathname,
        source: "LandingPage",
        type: "audio_playback",
      });
    } catch (error) {
      console.error("Failed to play pronunciation audio:", error);
    }
  };

  const handleStartButtonAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("🎯 Button clicked: Start Here");
    
    // Play pronunciation audio
    await playPronunciation();
    
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
      <div className="mt-12 flex gap-3 justify-start">
        <WaveButton
          variant="youtube"
          size="lg"
          onClick={handleStartButtonAction}
          onMouseEnter={isMobile ? undefined : playPronunciation}
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
