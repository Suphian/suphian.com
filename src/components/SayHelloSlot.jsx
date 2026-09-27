import React, { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useSectionViewed } from '../hooks/useSectionViewed.js';
import { useUI } from '../hooks/useUI.js';
import { afterFirstPaint } from '../lib/afterFirstPaint.js';
import '../sayhello/sayhello.css';

// Retry a failed chunk once (flaky networks, a deploy mid-session), as UIProvider does.
const SayHello = lazy(() => {
  const load = () => import('./SayHello.jsx');
  return load().catch(() => new Promise((resolve) => setTimeout(resolve, 1500)).then(load));
});

// SAY HELLO's box with nothing in it (sayhello.css): .say-hello-lettering's
// aspect-ratio gives it the lettering's exact height, so nothing moves when the
// letters arrive. Before its entrance the lettering is invisible anyway.
const placeholder = (
  <div className="say-hello-placeholder" aria-hidden="true">
    <div className="say-hello-lettering" />
  </div>
);

// A chunk that never loads leaves the empty box, not the page's error screen;
// the footer still has the email link.
class KeepBox extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? placeholder : this.props.children;
  }
}

/**
 * The #contact sign-off's wrapper. SAY HELLO's lettering and motion (a lazy
 * chunk, SayHello.jsx) load after the first paint: it sits at the bottom of
 * the page, so the first screen never waits for it (Suphian 2026-09-27:
 * snappier in aggregate).
 */
export default function SayHelloSlot() {
  const { openContact } = useUI();
  const wrap = useRef(null);
  const [ready, setReady] = useState(false);
  useSectionViewed(wrap, 'say_hello');

  useEffect(() => {
    let live = true;
    afterFirstPaint(() => live && setReady(true));
    return () => { live = false; };
  }, []);

  return (
    <div ref={wrap} id="contact" className="say-hello-wrap">
      {ready ? (
        <KeepBox>
          <Suspense fallback={placeholder}>
            <SayHello openContact={openContact} />
          </Suspense>
        </KeepBox>
      ) : placeholder}
    </div>
  );
}
