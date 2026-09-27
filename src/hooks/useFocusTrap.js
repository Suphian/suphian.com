import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// Dialogs render into document.body, so while any is open the app root is made
// inert and the page behind stops scrolling. Counted, so stacked opens are safe.
let openDialogs = 0;

function lockPage() {
  openDialogs += 1;
  if (openDialogs > 1) return;
  const html = document.documentElement;
  html.classList.add('is-locked');
  html.dataset.modal = 'open';
  const app = document.getElementById('root');
  if (app) app.inert = true;
}

function unlockPage() {
  openDialogs = Math.max(0, openDialogs - 1);
  if (openDialogs > 0) return;
  const html = document.documentElement;
  html.classList.remove('is-locked');
  delete html.dataset.modal;
  const app = document.getElementById('root');
  if (app) app.inert = false;
}

function focusables(container) {
  return [...container.querySelectorAll(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0 && !el.closest('[hidden]'),
  );
}

/**
 * Modal behaviour for an open dialog: traps Tab inside `ref`, closes on Escape,
 * locks background scroll, and returns focus to whatever opened it.
 */
export function useFocusTrap(open, ref, { onClose, initialFocus } = {}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const container = ref.current;
    if (!open || !container) return undefined;
    const opener = document.activeElement;
    lockPage();
    (initialFocus?.current ?? container).focus({ preventScroll: true });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables(container);
      if (!items.length) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const outside = !container.contains(active) || active === container;
      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || (outside && active !== container))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlockPage();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open, ref, initialFocus]);
}
