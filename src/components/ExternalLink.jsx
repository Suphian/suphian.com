import React from 'react';
import { common } from '../content.js';
import { track } from '../lib/analytics.js';

/**
 * `chapter` (a story chapter id) travels with the outbound_link_clicked event.
 * `label` names the link in that event when its children aren't plain text
 * (suph.app's build rows: an icon, a name and a month). Anything else, such as
 * aria-describedby, goes on the <a>.
 */
export default function ExternalLink({ href, children, className, chapter, label: trackedLabel, ...rest }) {
  const label = trackedLabel ?? (typeof children === 'string' ? children : undefined);
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" {...rest}
      onClick={() => track('outbound_link_clicked', { href, label, chapter })}>
      <span>{children}</span>
      <span className="sr-only"> {common.opensInNewTab}</span>
      <span className="link-arrow" aria-hidden="true">↗</span>
    </a>
  );
}
