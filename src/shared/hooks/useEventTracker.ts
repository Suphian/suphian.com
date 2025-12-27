
import { useEffect, useRef, useState } from 'react';

interface UseEventTrackerOptions {
  autoTrackPageViews?: boolean;
  autoTrackClicks?: boolean;
  autoTrackScrollEvents?: boolean;
}

// Lazy load analytics to prevent blocking if ad blockers interfere
let secureEventTrackerPromise: Promise<any> | null = null;
const getSecureEventTracker = async () => {
  if (!secureEventTrackerPromise) {
    secureEventTrackerPromise = import('@/utils/analytics/secureEventTracker')
      .then(module => module.secureEventTracker)
      .catch(err => {
        if (import.meta.env.DEV) {
          console.warn('Analytics module could not be loaded (may be blocked):', err);
        }
        return null;
      });
  }
  return secureEventTrackerPromise;
};

export const useEventTracker = (options: UseEventTrackerOptions = {}) => {
  const {
    autoTrackPageViews = true,
    autoTrackClicks = true,
    autoTrackScrollEvents = true
  } = options;

  const [tracker, setTracker] = useState<any>(null);
  const hasTrackedPageView = useRef(false);
  const lastScrollPercent = useRef(0);

  // Load analytics module asynchronously
  useEffect(() => {
    getSecureEventTracker().then(setTracker);
  }, []);

  useEffect(() => {
    if (!tracker) return; // Wait for tracker to load

    // Track page view with secure tracker
    if (autoTrackPageViews && !hasTrackedPageView.current) {
      if (import.meta.env.DEV) {
        console.log('📄 Tracking enhanced page view for:', window.location.pathname);
      }
      // Use requestIdleCallback for non-critical page view tracking
      const trackPageView = () => {
        tracker.track('page_view', {
          path: window.location.pathname,
          url: window.location.href,
          referrer: document.referrer,
          title: document.title,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight
        });
      };
      
      if ('requestIdleCallback' in window) {
        requestIdleCallback(trackPageView, { timeout: 2000 });
      } else {
        trackPageView();
      }
      hasTrackedPageView.current = true;
    }

    // Track clicks on elements with data-track attributes
    const handleClick = (event: MouseEvent) => {
      if (!tracker) return;
      const target = event.target as HTMLElement;
      const trackData = target.closest('[data-track]')?.getAttribute('data-track');
      
      if (trackData) {
        if (import.meta.env.DEV) {
          console.log('🖱️ Tracking click with data-track:', trackData);
        }
        try {
          const eventData = JSON.parse(trackData);
          tracker.track('element_click', {
            ...eventData,
            elementTag: target.tagName,
            elementText: target.textContent?.slice(0, 100),
            clickX: event.clientX,
            clickY: event.clientY,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          // Fallback for simple string values
          tracker.track('element_click', {
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
          if (import.meta.env.DEV) {
            console.log('🔘 Tracking button click:', target.textContent?.slice(0, 50));
          }
          tracker.track('button_click', {
            buttonText: target.textContent?.slice(0, 100),
            elementTag: target.tagName,
            clickX: event.clientX,
            clickY: event.clientY,
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    // Track scroll events with optimized throttling and caching
    let scrollTimeout: NodeJS.Timeout;
    let scrollAnimationFrame: number | null = null;
    let cachedPageHeight = 0;
    let cachedViewportHeight = 0;
    let lastScrollY = 0;

    const updateScrollCache = () => {
      // Use requestAnimationFrame to batch DOM reads
      if (scrollAnimationFrame) {
        cancelAnimationFrame(scrollAnimationFrame);
      }
      scrollAnimationFrame = requestAnimationFrame(() => {
        cachedPageHeight = document.documentElement.scrollHeight;
        cachedViewportHeight = window.innerHeight;
      });
    };

    const handleScroll = () => {
      if (!tracker) return;
      
      // Throttle scroll tracking more aggressively
      clearTimeout(scrollTimeout);
      
      // Use requestIdleCallback for scroll tracking when available
      const trackScroll = () => {
        const currentScrollY = window.scrollY;
        // Only process if scroll position changed significantly (performance optimization)
        if (Math.abs(currentScrollY - lastScrollY) < 50) {
          return;
        }
        lastScrollY = currentScrollY;
        
        const maxScroll = cachedPageHeight - cachedViewportHeight;
        if (maxScroll <= 0) return;
        
        const scrollPercent = Math.round((currentScrollY / maxScroll) * 100);
        
        // Track scroll milestones (25%, 50%, 75%, 100%)
        const milestones = [25, 50, 75, 100];
        for (const milestone of milestones) {
          if (scrollPercent >= milestone && lastScrollPercent.current < milestone) {
            if (import.meta.env.DEV) {
              console.log(`📜 Tracking scroll milestone: ${milestone}%`);
            }
            tracker.track('scroll_milestone', {
              milestone: milestone,
              scrollPercent: scrollPercent,
              scrollY: currentScrollY,
              pageHeight: cachedPageHeight,
              viewport_height: cachedViewportHeight,
              timestamp: new Date().toISOString()
            });
            lastScrollPercent.current = milestone;
            break;
          }
        }
      };

      // Use requestIdleCallback for non-critical scroll tracking
      if ('requestIdleCallback' in window) {
        scrollTimeout = setTimeout(() => {
          requestIdleCallback(trackScroll, { timeout: 500 });
        }, 300); // Increased throttle to 300ms
      } else {
        scrollTimeout = setTimeout(trackScroll, 300);
      }
    };

    const handleResize = () => {
      // Debounce resize events
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateScrollCache, 250);
    };

    // Initial cache update with requestAnimationFrame
    updateScrollCache();

    if (autoTrackClicks) {
      document.addEventListener('click', handleClick, true);
    }

    if (autoTrackScrollEvents) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize, { passive: true });
    }

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearTimeout(scrollTimeout);
      if (scrollAnimationFrame) {
        cancelAnimationFrame(scrollAnimationFrame);
      }
    };
  }, [autoTrackPageViews, autoTrackClicks, autoTrackScrollEvents, tracker]);

  // Return tracking functions for manual use (with fallback no-op if tracker not loaded)
  return {
    track: tracker ? tracker.track.bind(tracker) : () => {},
    getSessionInfo: tracker ? tracker.getSessionInfo.bind(tracker) : () => ({ sessionId: '', sessionData: null })
  };
};
