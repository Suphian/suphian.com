// Lazy loading utilities to defer non-critical JavaScript

// Cache for loaded modules to avoid repeated imports
const moduleCache = new Map<string, Promise<any>>();

/**
 * Lazy load analytics modules only when user interacts with the page
 */
export const loadAnalyticsOnInteraction = () => {
  const cacheKey = 'analytics';
  
  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey)!;
  }

  const promise = new Promise(async (resolve) => {
    // Wait for user interaction before loading analytics
    const loadOnInteraction = async () => {
      try {
        const [eventTracker, pageviewListener] = await Promise.all([
          import('@/hooks/useEventTracker'),
          import('@/components/AnalyticsPageviewListener')
        ]);
        
        resolve({ eventTracker, pageviewListener });
      } catch (error) {
        console.warn('Failed to load analytics:', error);
        resolve(null);
      }
    };

    // Load immediately if user has already interacted
    if (document.readyState === 'complete') {
      loadOnInteraction();
      return;
    }

    // Otherwise wait for first user interaction
    const events = ['click', 'scroll', 'keydown', 'touchstart'] as const;
    const onFirstInteraction = () => {
      events.forEach(event => 
        document.removeEventListener(event, onFirstInteraction)
      );
      loadOnInteraction();
    };

    events.forEach(event => 
      document.addEventListener(event, onFirstInteraction, { passive: true } as AddEventListenerOptions)
    );

    // Fallback: load after 3 seconds if no interaction
    setTimeout(loadOnInteraction, 3000);
  });

  moduleCache.set(cacheKey, promise);
  return promise;
};

/**
 * Lazy load contact forms only when needed
 */
export const loadContactForms = () => {
  const cacheKey = 'contact-forms';
  
  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey)!;
  }

  const promise = Promise.all([
    import('@/components/ContactForm'),
    import('@/components/ContactSheet'),
    import('@/components/RequestCVModal')
  ]);

  moduleCache.set(cacheKey, promise);
  return promise;
};

/**
 * Lazy load heavy widgets only when they come into view
 */
export const loadWidgetsOnIntersection = (element: Element) => {
  const cacheKey = 'widgets';
  
  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey)!;
  }

  const promise = new Promise(async (resolve) => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          try {
            const widgets = await Promise.all([
              import('@/components/StreamingRevenueWidget'),
              import('@/components/YouTubeMusicPlayer'),
              import('@/components/EarningsChart'),
              import('@/components/ComparisonTable')
            ]);
            resolve(widgets);
          } catch (error) {
            console.warn('Failed to load widgets:', error);
            resolve(null);
          }
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(element);
  });

  moduleCache.set(cacheKey, promise);
  return promise;
};
