import React from 'react';

/**
 * Big heading: content.js lines joined with <br />, closed by the red period.
 * The period carries its own class (style.css .heading-period), so other spans
 * inside an h2 keep their own colour.
 */
export default function Heading({ as: Tag = 'h2', lines, id, className, headingRef, tabIndex }) {
  const list = Array.isArray(lines) ? lines : [lines];
  return (
    <Tag id={id} className={className} ref={headingRef} tabIndex={tabIndex}>
      {list.map((line, index) => (
        <React.Fragment key={index}>
          {index > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
      <span className="heading-period">.</span>
    </Tag>
  );
}
