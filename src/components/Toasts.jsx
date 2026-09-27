import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { common } from '../content.js';
import { LIVE } from '../lib/backend.js';
import { CloseIcon } from './icons.jsx';
import './Toasts.css';

const DURATION = { default: 6000, error: 9000 };

function Toast({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(DURATION[toast.tone] ?? DURATION.default);

  useEffect(() => {
    if (paused) return undefined;
    const started = Date.now();
    const timer = setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, toast.id, onDismiss]);

  return (
    <li
      className={`toast${toast.tone === 'error' ? ' toast--error' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="toast-copy">
        <p className="toast-title">{toast.title}</p>
        {toast.description ? <p className="toast-description">{toast.description}</p> : null}
      </div>
      <button type="button" className="icon-button toast-close" aria-label={common.close} onClick={() => onDismiss(toast.id)}>
        <CloseIcon />
      </button>
    </li>
  );
}

/** Always mounted, so the polite live region exists before a toast arrives. */
export default function Toasts({ toasts, onDismiss }) {
  return createPortal(
    <ol className={`toasts${LIVE ? '' : ' toasts--above-pill'}`} aria-live="polite" aria-relevant="additions text">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </ol>,
    document.body,
  );
}
