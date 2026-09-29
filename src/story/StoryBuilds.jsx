import React from 'react';
import ExternalLink from '../components/ExternalLink.jsx';
import { buildsOf, formatMonth } from './logic.js';

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

const Links = ({ links, chapter }) =>
  links?.length > 0 && (
    <ul className="story-links">
      {links.map((link) => (
        <li key={link.href}>
          <ExternalLink href={link.href} className="story-link" chapter={chapter}>
            {link.label}
          </ExternalLink>
        </li>
      ))}
    </ul>
  );

/**
 * suph.app's open card, under its heading (Suphian 2026-09-28: "It should just
 * be a list… Have them listed below"): the intro line, the link to suph.app
 * itself, then every build, newest first, each its month, name, summary and
 * links, split by hairlines. No toggle, no arrows beyond the links' own.
 *
 * `onBuildEvent` tells StoryDetail where a mouse pointer or keyboard focus is,
 * so the image panel can show that build's icon (logic.js panelBuild decides);
 * a touch never moves it off the newest.
 */
export default function StoryBuilds({ chapter, introId, onBuildEvent = () => {} }) {
  const builds = buildsOf(chapter);
  const pointer = (event, fields) => onBuildEvent({ ...fields, pointerType: event.pointerType, finePointer: finePointer() });
  return (
    <>
      <p id={introId} className="story-detail-summary">{chapter.summary}</p>
      <Links links={chapter.links} chapter={chapter.id} />
      <ol
        className="story-builds"
        role="list"
        onPointerLeave={(event) => pointer(event, { type: 'leave' })}
        onBlur={(event) => onBuildEvent({ type: 'blur', inside: event.currentTarget.contains(event.relatedTarget) })}
      >
        {builds.map((build, index) => (
          <li
            key={build.slug}
            className="story-build"
            onPointerEnter={(event) => pointer(event, { type: 'enter', index })}
            onFocus={(event) => onBuildEvent({ type: 'focus', index, keyboard: isKeyboardFocus(event.target) })}
          >
            <p className="story-build-month">
              <time dateTime={build.month}>{formatMonth(build.month)}</time>
            </p>
            <h3 className="story-build-name">{build.name}</h3>
            <p className="story-build-summary">{build.summary}</p>
            <Links links={build.links} chapter={chapter.id} />
          </li>
        ))}
      </ol>
    </>
  );
}
