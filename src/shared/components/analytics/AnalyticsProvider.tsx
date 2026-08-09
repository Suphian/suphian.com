import { useEffect } from "react";
import { useAdvancedAnalytics } from "@/shared/hooks/useAdvancedAnalytics";
import { secureEventTracker } from "@/shared/utils/analytics/secureEventTracker";

export const AnalyticsProvider = () => {
  // Expose the global tracking API once the analytics chunk has loaded.
  // Call sites use window.trackEvent?.() so calls before this mount are safe no-ops.
  useEffect(() => {
    window.trackEvent = (eventName, eventData) => {
      void secureEventTracker.track(eventName, eventData ?? {});
    };
    return () => {
      delete window.trackEvent;
    };
  }, []);

  useAdvancedAnalytics({
    trackFormEngagement: true,
    trackExternalLinks: true,
    trackCopyEvents: true,
    trackErrors: true,
    trackAudioEngagement: true,
    trackTimeOnPage: true,
    onTrack: (eventName, payload) => {
      secureEventTracker.track(eventName, payload);
    },
  });

  return null;
};

export default AnalyticsProvider;
