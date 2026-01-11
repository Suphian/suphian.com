import React, { useState, useRef, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { WaveButton } from "@/shared/components/ui/wave-button";

const LazyContactSheet = React.lazy(() => import("@/features/contact/components/ContactSheet"));

const CallToAction = () => {
  const _location = useLocation();
  const [contactOpen, setContactOpen] = useState(false);
  const isMobile = useIsMobile();
  const lastAudioPlayRef = useRef<number>(0);
  const hasUserInteractedRef = useRef<boolean>(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const playPronunciation = async (source = "unknown") => {
    const now = Date.now();
    
    if (now - lastAudioPlayRef.current < 60000) {
      return; // Skip if audio was played within last 1 minute
    }
    
    // For hover events, show a helpful message about clicking first
    if (source === "hover" && !hasUserInteractedRef.current) {
      return;
    }
    
    try {
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
      console.error("❌ Failed to play pronunciation audio:", error);
      if (error.name === 'NotAllowedError') {
        console.error("🚫 Audio blocked by browser - user interaction required first");
      }
    }
  };

  const handleStartButtonAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Track if user clicked during hover timeout
    const wasHovering = hoverTimeoutRef.current !== null;
    
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
        type: wasHovering ? "click_during_hover" : "direct_click",
        interaction_context: wasHovering ? "interrupted_hover" : "direct_action"
      });
    } catch (error) {
      console.error("❌ Failed to track start here event:", error);
    }
    
    scrollToContent();
  };

  const scrollToContent = () => {
    const contentSection = document.getElementById("content-section");
    if (contentSection) {
      // Use scrollIntoView to avoid forced reflow from offsetTop
      contentSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      
      window.dispatchEvent(new Event('startButtonClicked'));
    }
  };

  const handleMouseEnter = () => {
    if (isMobile) {
      return;
    }
    
    // Track hover start
    window.trackEvent?.("landing_cta_hover_start", {
      label: "Start Here hover began",
      page: window.location.pathname,
      source: "LandingPage",
      type: "hover_interaction",
    });
    
    // Always try to play pronunciation audio on hover
    playPronunciation("hover");
    
    // Set timeout for auto-scroll after animation duration (3s)
    hoverTimeoutRef.current = setTimeout(async () => {
      
      try {
        await window.trackEvent?.("landing_cta_hover_completion", {
          label: "Start Here hover completed - auto scroll",
          page: window.location.pathname,
          source: "LandingPage",
          type: "hover_completion_auto_scroll",
          duration_ms: 3000
        });
      } catch (error) {
        console.error("❌ Failed to track hover completion event:", error);
      }
      
      scrollToContent();
    }, 3000); // 3 seconds to let user fully experience the hover effect
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    
    // Track hover interruption if timeout was active
    if (hoverTimeoutRef.current) {
      window.trackEvent?.("landing_cta_hover_interrupted", {
        label: "Start Here hover interrupted",
        page: window.location.pathname,
        source: "LandingPage",
        type: "hover_interruption",
      });
    }
    
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
              <div className="w-1 h-3 bg-[#FF3B30] rounded-full opacity-60 group-hover:animate-pulse group-hover:opacity-100 transition-all duration-500"></div>
              <div className="w-1 h-4 bg-[#FF3B30] rounded-full opacity-60 group-hover:animate-pulse group-hover:opacity-100 transition-all duration-500" style={{animationDelay: '0.1s'}}></div>
              <div className="w-1 h-2 bg-[#FF3B30] rounded-full opacity-60 group-hover:animate-pulse group-hover:opacity-100 transition-all duration-500" style={{animationDelay: '0.2s'}}></div>
              <div className="w-1 h-5 bg-[#FF3B30] rounded-full opacity-60 group-hover:animate-pulse group-hover:opacity-100 transition-all duration-500" style={{animationDelay: '0.3s'}}></div>
              <div className="w-1 h-3 bg-[#FF3B30] rounded-full opacity-60 group-hover:animate-pulse group-hover:opacity-100 transition-all duration-500" style={{animationDelay: '0.4s'}}></div>
            </div>
            {isMobile ? "Start" : "Start Here"}
          </div>
        </WaveButton>
      </div>

      <Suspense fallback={null}>
        <LazyContactSheet open={contactOpen} onOpenChange={setContactOpen} />
      </Suspense>
    </>
  );
};

export default CallToAction;
