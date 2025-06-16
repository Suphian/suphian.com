
import { useEffect, useRef } from 'react';
import { eventTracker } from '@/utils/analytics/eventTracker';

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

  useEffect(() => {
    // Track page view
    if (autoTrackPageViews && !hasTrackedPageView.current) {
      eventTracker.track('page_view', {
        path: window.location.pathname,
        url: window.location.href,
        referrer: document.referrer
      });
      hasTrackedPageView.current = true;
    }

    // Track clicks on elements with data-track attributes
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const trackData = target.closest('[data-track]')?.getAttribute('data-track');
      
      if (trackData) {
        try {
          const eventData = JSON.parse(trackData);
          eventTracker.track('element_click', {
            ...eventData,
            elementTag: target.tagName,
            elementText: target.textContent?.slice(0, 100)
          });
        } catch (error) {
          // Fallback for simple string values
          eventTracker.track('element_click', {
            action: trackData,
            elementTag: target.tagName,
            elementText: target.textContent?.slice(0, 100)
          });
        }
      }
    };

    // Track scroll events
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollPercent = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        
        if (scrollPercent > 0 && scrollPercent % 25 === 0) {
          eventTracker.track('scroll_progress', {
            percent: scrollPercent,
            scrollY: window.scrollY
          });
        }
      }, 100);
    };

    if (autoTrackClicks) {
      document.addEventListener('click', handleClick);
    }

    if (autoTrackScrollEvents) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [autoTrackPageViews, autoTrackClicks, autoTrackScrollEvents]);

  // Return tracking functions for manual use
  return {
    track: eventTracker.track.bind(eventTracker),
    getSessionInfo: eventTracker.getSessionInfo.bind(eventTracker)
  };
};
