import React, { useRef } from 'react';
import { footer } from '../content.js';
import { useSectionViewed } from '../hooks/useSectionViewed.js';
import { track } from '../lib/analytics.js';
import { scrollToTop } from '../lib/scroll.js';

export default function Footer() {
  const root = useRef(null);
  useSectionViewed(root, 'footer');

  const backToTop = (event) => {
    event.preventDefault();
    scrollToTop();
    document.getElementById('main')?.focus({ preventScroll: true });
  };

  return (
    <footer ref={root} className="site-footer">
      <div className="footer">
        <span>{footer.copyright()}</span>
        <nav aria-label={footer.label}>
          <ul className="footer-links">
            {footer.links.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.ariaLabel}
                  onClick={() => track('outbound_link_clicked', { href: link.href, label: link.label })}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a className="footer-email" href={footer.email.href} onClick={() => track('email_link_clicked')}>
            {footer.email.label}
          </a>
        </nav>
        <a href="#main" onClick={backToTop}>
          {footer.backToTop} <span className="link-arrow" aria-hidden="true">↑</span>
        </a>
      </div>
    </footer>
  );
}
