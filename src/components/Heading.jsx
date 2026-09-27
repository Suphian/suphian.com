import React from 'react';

/**
 * Big heading: content.js lines joined with <br />, closed by the red period.
 * The period carries its own class (style.css .heading-period), so other spans
 * inside an h2 keep their own colour.
 */
export default function Heading({ lines, id, className }) {
  const list = Array.isArray(lines) ? lines : [lines];
  return (
    <h2 id={id} className={className}>
      {list.map((line, index) => (
        <React.Fragment key={index}>
          {index > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
      <span className="heading-period">.</span>
    </h2>
  );
}
