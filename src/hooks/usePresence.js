import { useEffect, useRef, useState } from 'react';

/**
 * Keeps an element mounted through its exit transition.
 * `mounted`: render it. `entered`: apply the open styles (set a frame after
 * mount so the closed styles paint first and CSS transitions run).
 */
export function usePresence(open, exitMs = 400) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    const isFirst = first.current;
    first.current = false;
    if (open) {
      setExiting(false);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setEntered(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setEntered(false);
    if (isFirst) return undefined;
    setExiting(true);
    const timer = setTimeout(() => setExiting(false), exitMs);
    return () => clearTimeout(timer);
  }, [open, exitMs]);

  return { mounted: open || exiting, entered: open && entered };
}
