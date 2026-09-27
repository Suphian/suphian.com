import React from 'react';
import { common } from '../content.js';

export default function ExternalLink({ href, children, className = 'text-link' }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      <span>{children}</span>
      <span className="sr-only"> {common.opensInNewTab}</span>
      <span className="link-arrow" aria-hidden="true">↗</span>
    </a>
  );
}
