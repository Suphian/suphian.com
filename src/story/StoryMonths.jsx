import React from 'react';
import { story } from '../content.js';
import { clampIndex, formatMonth, hasMonthToggle } from './logic.js';

/**
 * suph.app's month toggle, in the open card where the years line would be:
 * "← Previous  September 2026  Next →" (Suphian 2026-09-28: "As you toggle
 * through the months, you can get different icons"). Quiet text buttons, not
 * pills. Builds run newest first, so Previous steps to an older build (a higher
 * index) and Next to a newer one. At either end the button stays focusable but
 * does nothing (aria-disabled), so keyboard focus never drops out of the
 * dialog. The month is a polite live region: a screen reader hears the new
 * month after each step. Nothing at all with fewer than two builds.
 */
export default function StoryMonths({ builds, index, labelId, onChange }) {
  if (!hasMonthToggle(builds)) return null;
  const at = clampIndex(index, builds.length);
  const step = (next, enabled) => () => {
    if (enabled) onChange(next);
  };
  const older = at < builds.length - 1;
  const newer = at > 0;
  return (
    <div className="story-months" role="group" aria-label={story.labels.months}>
      <button type="button" className="story-month-step" aria-disabled={older ? undefined : 'true'} onClick={step(at + 1, older)}>
        <span className="story-month-arrow" aria-hidden="true">←</span>
        {story.labels.previousMonth}
      </button>
      <p id={labelId} className="story-month-label" aria-live="polite" aria-atomic="true" data-swap>
        {formatMonth(builds[at].month)}
      </p>
      <button type="button" className="story-month-step" aria-disabled={newer ? undefined : 'true'} onClick={step(at - 1, newer)}>
        {story.labels.nextMonth}
        <span className="story-month-arrow" aria-hidden="true">→</span>
      </button>
    </div>
  );
}
