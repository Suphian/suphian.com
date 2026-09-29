import React, { useState } from 'react';
import { cardImage, logoShift, logoWidth } from './logic.js';

// Images that already loaded once, with their aspect ratio, so a second card
// for the same chapter (the open view's panel) paints its image on the first frame.
const loaded = new Map();

const aspectOf = (image) => (image.naturalWidth > 0 && image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : null);

/**
 * Loads a card image ahead of time and records its aspect, so a card that later
 * switches to it (suph.app's open card, as the pointer moves between builds) paints it on the first frame.
 */
export function preloadCardImage(src) {
  if (!src || loaded.has(src) || typeof Image === 'undefined') return;
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => loaded.set(src, aspectOf(image));
  image.src = src;
}

const initialState = (src) => {
  if (!src) return { src, status: 'missing', aspect: null };
  if (loaded.has(src)) return { src, status: 'loaded', aspect: loaded.get(src) };
  return { src, status: 'loading', aspect: null };
};

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
 *
 * `imageLoading` is the img's loading attribute: the rail starts 'lazy' and
 * turns 'eager' after the first paint (StoryIndex); the open view leaves it unset.
 */
export default function StoryCard({ chapter, className = '', cardRef, imageLoading, ...rest }) {
  const { src, nudge } = cardImage(chapter.image);
  const [stored, setState] = useState(() => initialState(src));
  // A new image (suph.app's panel following a build): start over from what is known about it.
  // The card itself stays, so its color can ease to the new build's.
  const state = stored.src === src ? stored : initialState(src);
  if (stored.src !== src) setState(state);

  const onLoad = (event) => {
    const aspect = aspectOf(event.currentTarget);
    loaded.set(src, aspect);
    setState({ src, status: 'loaded', aspect });
  };
  const onError = () => setState({ src, status: 'missing', aspect: null });

  return (
    <div ref={cardRef} className={`story-card ${className}`} data-status={state.status} aria-hidden="true"
      style={chapter.color ? { '--card-color': chapter.color } : undefined} {...rest}>
      {state.status === 'missing' ? (
        <span className="story-card-name">{`${chapter.name}.`}</span>
      ) : (
        <img
          key={src}
          className="story-card-logo"
          src={src}
          alt=""
          loading={imageLoading}
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
