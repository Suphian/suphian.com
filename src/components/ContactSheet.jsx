import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { common, contact } from '../content.js';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import { usePresence } from '../hooks/usePresence.js';
import ContactForm from './ContactForm.jsx';
import Heading from './Heading.jsx';
import { CloseIcon } from './icons.jsx';
import './ContactSheet.css';

/**
 * Slide-over from the right. Stays mounted (hidden) once opened, so a draft
 * survives an accidental close; a successful send resets it.
 * `source` names what opened it and travels with the notification email.
 */
export default function ContactSheet({ open, source, onClose }) {
  const panel = useRef(null);
  const { mounted, entered } = usePresence(open, 450);
  useFocusTrap(open, panel, { onClose });

  return createPortal(
    <div className="sheet" data-state={entered ? 'open' : 'closed'} hidden={!mounted}>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-sheet-title"
        tabIndex={-1}
      >
        <div className="sheet-top">
          <button type="button" className="icon-button" aria-label={common.close} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <Heading id="contact-sheet-title" className="sheet-title" lines={contact.title} />
        <ContactForm source={source} onSubmitted={onClose} />
      </div>
    </div>,
    document.body,
  );
}
