// Lazy loading utilities for analytics to reduce initial bundle size

// Dynamically import analytics modules only when needed
export const getGoogleAnalytics = () => import('./googleAnalytics');
export const getSecureEventTracker = () => import('./secureEventTracker');
export const getLocationService = () => import('./locationService');

// Lazy track function that loads analytics on demand
export const lazyTrackEvent = async (eventName: string, eventData: Record<string, unknown> = {}) => {
  try {
    const { trackEvent } = await getGoogleAnalytics();
    return trackEvent(eventName, eventData);
  } catch (error) {
    console.warn('Analytics not available:', error);
  }
};

// Lazy page view tracking
export const lazyTrackPageView = async () => {
  try {
    const { trackPageView } = await getGoogleAnalytics();
    return trackPageView();
  } catch (error) {
    console.warn('Analytics not available:', error);
  }
};