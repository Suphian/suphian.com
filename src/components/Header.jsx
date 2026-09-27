import React from 'react';
import { hero } from '../content.js';

/**
 * Fixed header: the edition line on the left; the docked SUPH (rendered by the
 * Wordmark) sits on the right. No nav (Suphian dropped the dot, Work and
 * Contact): contact is SAY HELLO and the footer email.
 */
export default function Header() {
  return (
    <header className="header">
      {/* Real spaces outside the hidden slash, so screen readers hear
          "Product Payments AI", not one run-on word. */}
      <p className="edition">
        {hero.edition.map((word, index) => (
          <React.Fragment key={word}>
            {index > 0 && <>{' '}<i aria-hidden="true">/</i>{' '}</>}
            {word}
          </React.Fragment>
        ))}
      </p>
    </header>
  );
}
