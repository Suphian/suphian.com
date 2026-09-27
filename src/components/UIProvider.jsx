import React, { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import Toasts from './Toasts.jsx';
import { UIContext } from './uiContext.js';

// Retry a failed chunk once (flaky networks, a deploy mid-session).
const lazyWithRetry = (load) =>
  lazy(() => load().catch(() => new Promise((resolve) => setTimeout(resolve, 1500)).then(load)));

const ContactSheet = lazyWithRetry(() => import('./ContactSheet.jsx'));

const MAX_TOASTS = 3;

/**
 * One app-level contact sheet and toast stack. The sheet is a lazy chunk,
 * loaded the first time it opens.
 */
export function UIProvider({ children }) {
  const [contact, setContact] = useState({ open: false, source: 'unknown', used: false });
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const openContact = useCallback((source = 'unknown') => setContact({ open: true, source, used: true }), []);
  const closeContact = useCallback(() => setContact((state) => ({ ...state, open: false })), []);

  const toast = useCallback((next) => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((list) => [...list, { id, ...next }].slice(-MAX_TOASTS));
  }, []);
  const dismissToast = useCallback((id) => setToasts((list) => list.filter((item) => item.id !== id)), []);

  const value = useMemo(() => ({ openContact, closeContact, toast }), [openContact, closeContact, toast]);

  return (
    <UIContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        {contact.used && <ContactSheet open={contact.open} source={contact.source} onClose={closeContact} />}
      </Suspense>
      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </UIContext.Provider>
  );
}
