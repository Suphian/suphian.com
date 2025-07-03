
import { useEffect, useRef } from 'react';
import { secureEventTracker } from '@/utils/analytics/secureEventTracker';
import { EnhancedTracker } from '@/utils/analytics/enhancedTracker';

interface UseEventTrackerOptions {
  autoTrackPageViews?: boolean;
  autoTrackClicks?: boolean;
  autoTrackScrollEvents?: boolean;
}

export const useEventTracker = (options: UseEventTrackerOptions = {}) => {
  const {
    autoTrackPageViews = true,
    autoTrackClicks = true,
    autoTrackScrollEvents = true
  } = options;

  const hasTrackedPageView = useRef(false);
  const lastScrollPercent = useRef(0);

  useEffect(() => {
    // Set up enhanced UI event tracking
    EnhancedTracker.setupUIEventTracking((eventName, eventData) => {
      secureEventTracker.track(eventName, eventData);
    });

    // Track page view with secure tracker
    if (autoTrackPageViews && !hasTrackedPageView.current) {
      console.log('📄 Tracking enhanced page view for:', window.location.pathname);
      secureEventTracker.track('page_view', {
        path: window.location.pathname,
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight
      });
      hasTrackedPageView.current = true;
    }

    // Track clicks on elements with data-track attributes
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const trackData = target.closest('[data-track]')?.getAttribute('data-track');
      
      if (trackData) {
        console.log('🖱️ Tracking click with data-track:', trackData);
        try {
          const eventData = JSON.parse(trackData);
          secureEventTracker.track('element_click', {
            ...eventData,
            elementTag: target.tagName,
            elementText: target.textContent?.slice(0, 100),
            clickX: event.clientX,
            clickY: event.clientY,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          // Fallback for simple string values
          secureEventTracker.track('element_click', {
            action: trackData,
            elementTag: target.tagName,
            elementText: target.textContent?.slice(0, 100),
            clickX: event.clientX,
            clickY: event.clientY,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Track any button clicks even without data-track
        const isButton = target.tagName === 'BUTTON' || target.closest('button');
        if (isButton) {
          console.log('🔘 Tracking button click:', target.textContent?.slice(0, 50));
          secureEventTracker.track('button_click', {
            buttonText: target.textContent?.slice(0, 100),
            elementTag: target.tagName,
            clickX: event.clientX,
            clickY: event.clientY,
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    // Track scroll events with improved logic
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollPercent = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        
        // Track scroll milestones (25%, 50%, 75%, 100%)
        const milestones = [25, 50, 75, 100];
        for (const milestone of milestones) {
          if (scrollPercent >= milestone && lastScrollPercent.current < milestone) {
            console.log(`📜 Tracking scroll milestone: ${milestone}%`);
            secureEventTracker.track('scroll_milestone', {
              milestone: milestone,
              scrollPercent: scrollPercent,
              scrollY: window.scrollY,
              pageHeight: document.documentElement.scrollHeight,
              viewport_height: window.innerHeight,
              timestamp: new Date().toISOString()
            });
            lastScrollPercent.current = milestone;
            break;
          }
        }
      }, 250);
    };

    if (autoTrackClicks) {
      document.addEventListener('click', handleClick, true);
    }

    if (autoTrackScrollEvents) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [autoTrackPageViews, autoTrackClicks, autoTrackScrollEvents]);

  // Return tracking functions for manual use
  return {
    track: secureEventTracker.track.bind(secureEventTracker),
    getSessionInfo: secureEventTracker.getSessionInfo.bind(secureEventTracker)
  };
};
