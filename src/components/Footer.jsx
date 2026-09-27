import React from 'react';
import { footer } from '../content.js';
import { scrollToTop } from '../lib/scroll.js';

export default function Footer() {
  const backToTop = (event) => {
    event.preventDefault();
    scrollToTop();
    document.getElementById('main')?.focus({ preventScroll: true });
  };

  return (
    <footer className="site-footer">
      <div className="footer">
        <span>{footer.copyright()}</span>
        <nav aria-label={footer.label}>
          <ul className="footer-links">
            {footer.links.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.ariaLabel}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a className="footer-email" href={footer.email.href}>{footer.email.label}</a>
        </nav>
        <a href="#main" onClick={backToTop}>
          {footer.backToTop} <span className="link-arrow" aria-hidden="true">↑</span>
        </a>
      </div>
    </footer>
  );
}
