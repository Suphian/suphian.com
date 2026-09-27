import React, { useCallback, useLayoutEffect } from 'react';
import Wordmark from './wordmark/Wordmark.jsx';
import { nav } from './content.js';
import { LIVE } from './lib/backend.js';
import { isPlainClick, scrollToId, scrollToTop } from './lib/scroll.js';
import { UIProvider } from './components/UIProvider.jsx';
import DryRunBadge from './components/DryRunBadge.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';

// One page, so no router (Suphian 2026-09-27: snappier in aggregate; react-router
// was 21 kB gzip of the first load). Unknown URLs are sent home in main.jsx.

// A /#work link: that section, once React has replaced the static profile. Otherwise
// the browser's own scroll restoration stands.
function useInitialHash() {
  useLayoutEffect(() => {
    const { hash } = window.location;
    if (hash) scrollToId(decodeURIComponent(hash.slice(1)), { instant: true, focus: false });
  }, []);
}

function Shell() {
  useInitialHash();

  const onHome = useCallback((event) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    scrollToTop();
    document.getElementById('main')?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">{nav.skip}</a>
      <Header />
      <Wordmark docked={false} homeHref="/" onHome={onHome} label={nav.home} />
      <main id="main" tabIndex={-1}>
        <ErrorBoundary>
          <Home />
        </ErrorBoundary>
      </main>
      <Footer />
      {!LIVE && <DryRunBadge />}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <UIProvider>
        <Shell />
      </UIProvider>
    </ErrorBoundary>
  );
}
