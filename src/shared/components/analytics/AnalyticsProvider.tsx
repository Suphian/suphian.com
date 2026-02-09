import { useAdvancedAnalytics } from "@/shared/hooks/useAdvancedAnalytics";
import { secureEventTracker } from "@/shared/utils/analytics/secureEventTracker";

export const AnalyticsProvider = () => {
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
