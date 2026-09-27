import React from 'react';
import { hero } from '../content.js';
import { isPlainClick, scrollToId } from '../lib/scroll.js';
import SayHelloSlot from '../components/SayHelloSlot.jsx';
import StoryIndex from '../story/StoryIndex.jsx';

export default function Home() {
  const onCue = (event) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    scrollToId(hero.cueHref.slice(1));
  };

  return (
    <>
      {/* The Wordmark measures [data-wordmark-hero]; keep it the 100svh viewport inside the 112svh hero. */}
      <section className="hero" aria-labelledby="hero-title">
        <div data-wordmark-hero className="opening-viewport">
          <h1 id="hero-title" className="sr-only">{hero.srTitle}</h1>
          <div className="hero-bottom">
            <a className="scroll-cue" href={hero.cueHref} onClick={onCue}>
              <span className="arrow" aria-hidden="true" />
              <span>
                {hero.cue.map((line, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </span>
            </a>
          </div>
        </div>
      </section>
      <StoryIndex />
      <SayHelloSlot />
    </>
  );
}
