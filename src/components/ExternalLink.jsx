import React from 'react';
import { common } from '../content.js';
import { track } from '../lib/analytics.js';

/** `chapter` (a story chapter id) travels with the outbound_link_clicked event. */
export default function ExternalLink({ href, children, className, chapter }) {
  const label = typeof children === 'string' ? children : undefined;
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer"
      onClick={() => track('outbound_link_clicked', { href, label, chapter })}>
      <span>{children}</span>
      <span className="sr-only"> {common.opensInNewTab}</span>
      <span className="link-arrow" aria-hidden="true">↗</span>
    </a>
  );
}
