import React, { useState } from 'react';
import { cardImage, logoShift, logoWidth } from './logic.js';

// Images that already loaded once, with their aspect ratio, so a second card
// for the same chapter (the open view's panel) paints its image on the first frame.
const loaded = new Map();

/**
 * One chapter's card, in the rail and (sized up) as the open view's image
 * panel: the chapter's white logo centred on its company color. Every chapter
 * gets the same treatment, suph.app's crown included (Suphian: "just put the
 * crown logo", so it matches the other cards). Decorative (aria-hidden,
 * alt ""): the list and headings carry the name. While the logo loads the card
 * shows just its color; if there is no image, or it fails, the card sets the
 * name in type instead, so it never looks broken.
 *
 * Sizing: logoWidth() gives every logo the same visual area, whatever its
 * aspect ratio. Centring: the card is a one-cell grid that centres the logo's
 * box (its tight viewBox) on both axes, in the rail and in the panel alike. A
 * wordmark with a descending "g" also carries an optical nudge (content.js
 * image.nudge, measured in logo-geometry.js), a translate of a few percent of
 * its own height, so the mass of its letters, not the box that includes the
 * tail of the g, sits on the centre.
 */
export default function StoryCard({ chapter, className = '', cardRef, ...rest }) {
  const { src, nudge } = cardImage(chapter.image);
  const [state, setState] = useState(() => {
    if (!src) return { status: 'missing', aspect: null };
    if (loaded.has(src)) return { status: 'loaded', aspect: loaded.get(src) };
    return { status: 'loading', aspect: null };
  });

  const onLoad = (event) => {
    const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
    const aspect = width > 0 && height > 0 ? width / height : null;
    loaded.set(src, aspect);
    setState({ status: 'loaded', aspect });
  };
  const onError = () => setState({ status: 'missing', aspect: null });

  return (
    <div ref={cardRef} className={`story-card ${className}`} data-status={state.status} aria-hidden="true"
      style={chapter.color ? { '--card-color': chapter.color } : undefined} {...rest}>
      {state.status === 'missing' ? (
        <span className="story-card-name">{`${chapter.name}.`}</span>
      ) : (
        <img
          className="story-card-logo"
          src={src}
          alt=""
          decoding="async"
          draggable="false"
          style={{ width: `${logoWidth(state.aspect)}%`, transform: logoShift(nudge) }}
          onLoad={onLoad}
          onError={onError}
        />
      )}
    </div>
  );
}
