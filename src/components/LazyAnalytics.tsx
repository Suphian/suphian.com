import { useEffect, useRef } from 'react';

/**
 * Lazy analytics component that loads analytics only when needed
 */
export const LazyAnalytics = () => {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const loadAnalytics = async () => {
      try {
        // Wait for user interaction before loading analytics
        const waitForInteraction = () => {
          return new Promise<void>((resolve) => {
            const events = ['click', 'scroll', 'keydown', 'touchstart'] as const;
            const onFirstInteraction = () => {
              events.forEach(event => 
                document.removeEventListener(event, onFirstInteraction)
              );
              resolve();
            };

            events.forEach(event => 
              document.addEventListener(event, onFirstInteraction, { passive: true } as AddEventListenerOptions)
            );

            // Fallback: load after 2 seconds if no interaction
            setTimeout(resolve, 2000);
          });
        };

        await waitForInteraction();

        // Now load analytics modules
        const [{ useEventTracker }, { AnalyticsPageviewListener }] = await Promise.all([
          import('@/hooks/useEventTracker'),
          import('@/components/AnalyticsPageviewListener')
        ]);

        // Initialize tracking after loading
        const tracker = useEventTracker({
          autoTrackPageViews: true,
          autoTrackClicks: true,
          autoTrackScrollEvents: true
        });

        console.log('📊 Analytics loaded and initialized');
      } catch (error) {
        console.warn('Analytics failed to load:', error);
      }
    };

    loadAnalytics();
  }, []);

  return null;
};