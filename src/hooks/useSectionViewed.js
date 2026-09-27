import { useEffect } from 'react';
import { analyticsEnabled, trackOnce, viewThreshold } from '../lib/analytics.js';

/**
 * section_viewed, once per page load, the first time the element in `ref` is in
 * view: half of it, or half the screen for a section taller than that.
 */
export function useSectionViewed(ref, section) {
  useEffect(() => {
    const node = ref.current;
    if (!analyticsEnabled || !node || !('IntersectionObserver' in window)) return undefined;
    const threshold = viewThreshold(node.getBoundingClientRect().height, window.innerHeight);
    const observer = new IntersectionObserver(([entry]) => {
      // The first callback reports any overlap; only a real threshold crossing counts.
      if (!entry.isIntersecting || entry.intersectionRatio < threshold * 0.95) return;
      observer.disconnect();
      trackOnce('section_viewed', { section });
    }, { threshold });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, section]);
}
