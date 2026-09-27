export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const behavior = () => (prefersReducedMotion() ? 'auto' : 'smooth');

/** Scrolls a section under the fixed header (via scroll-margin-top) and moves focus to it. */
export function scrollToId(id, { focus = true, instant = false } = {}) {
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ block: 'start', behavior: instant ? 'instant' : behavior() });
  if (focus) {
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  return true;
}

export function scrollToTop({ instant = false } = {}) {
  window.scrollTo({ top: 0, left: 0, behavior: instant ? 'instant' : behavior() });
}

/** A left click with no modifier: safe to replace the link's default navigation. */
export const isPlainClick = (event) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
