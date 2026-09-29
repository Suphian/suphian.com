import React from 'react';
import ExternalLink from '../components/ExternalLink.jsx';
import { buildsOf, cardImage, formatMonth, logoShift } from './logic.js';

// A mouse, not a finger: only then does the pointer pick the panel's icon.
const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const finePointer = () => typeof window !== 'undefined' && window.matchMedia(FINE_POINTER).matches;
// Keyboard focus draws a ring (:focus-visible); a tap or click on a link doesn't (as in StoryIndex).
const isKeyboardFocus = (element) => {
  try {
    return element.matches(':focus-visible');
  } catch {
    return false;
  }
};

/**
 * suph.app's projects in its open card, where other chapters list their links
 * (ChapterBody): every build, newest first, one line each. Suphian 2026-09-28:
 * "Condense. What happens when I have 12 months of projects?… Maybe you don't
 * need the description", and "Just keep the projects". One line each keeps a
 * long list short (about 56px a row).
 * Each row is a single link to the build's page (its first link): a small icon
 * token on the build's color, the name, the month and ↗. The summary isn't
 * shown; screen readers get it as the link's description.
 *
 * `onBuildEvent` tells StoryDetail where a mouse pointer or keyboard focus is,
 * so the image panel can show that build's icon (logic.js panelBuild decides);
 * a touch never moves it off the newest.
 */
export default function StoryBuilds({ chapter, onBuildEvent = () => {} }) {
  const builds = buildsOf(chapter);
  const pointer = (event, fields) => onBuildEvent({ ...fields, pointerType: event.pointerType, finePointer: finePointer() });
  return (
    <ol
      className="story-builds"
      role="list"
      onPointerLeave={(event) => pointer(event, { type: 'leave' })}
      onBlur={(event) => onBuildEvent({ type: 'blur', inside: event.currentTarget.contains(event.relatedTarget) })}
    >
      {builds.map((build, index) => {
        const [link] = build.links;
        const { src, nudge } = cardImage(build.image);
        const summaryId = `story-build-${chapter.id}-${build.slug}`;
        return (
          <li
            key={build.slug}
            className="story-build"
            onPointerEnter={(event) => pointer(event, { type: 'enter', index })}
            onFocus={(event) => onBuildEvent({ type: 'focus', index, keyboard: isKeyboardFocus(event.target) })}
          >
            <ExternalLink href={link.href} label={link.label} className="story-link story-build-link" chapter={chapter.id} aria-describedby={summaryId}>
              <span className="story-build-token" aria-hidden="true" style={{ '--token-color': build.color || chapter.color }}>
                {src && <img src={src} alt="" decoding="async" draggable="false" style={{ transform: logoShift(nudge) }} />}
              </span>
              <span className="story-build-name">{build.name}</span>
              <time className="story-build-month" dateTime={build.month}>{formatMonth(build.month)}</time>
            </ExternalLink>
            <span id={summaryId} hidden>{build.summary}</span>
          </li>
        );
      })}
    </ol>
  );
}
