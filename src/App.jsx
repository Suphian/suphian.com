import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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

// New route (an unknown URL redirecting home): top of the page, or the #section
// it asked for (a /#work link). The first load keeps the browser's own restoration.
function useRouteScroll({ pathname, hash }) {
  const first = useRef(true);
  useLayoutEffect(() => {
    const initial = first.current;
    first.current = false;
    if (hash && scrollToId(decodeURIComponent(hash.slice(1)), { instant: true, focus: !initial })) return;
    if (!initial) scrollToTop({ instant: true });
    // Only a path change is a new page; hash-only changes are in-page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  useRouteScroll(location);

  const onHome = useCallback(
    (event) => {
      if (!isPlainClick(event)) return;
      event.preventDefault();
      if (window.location.pathname === '/') {
        scrollToTop();
        document.getElementById('main')?.focus({ preventScroll: true });
      } else {
        navigate('/');
      }
    },
    [navigate],
  );

  return (
    <>
      <a className="skip-link" href="#main">{nav.skip}</a>
      <Header />
      <Wordmark docked={!isHome} homeHref="/" onHome={onHome} label={nav.home} />
      <main id="main" tabIndex={-1}>
        <ErrorBoundary key={location.pathname}>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* No dead ends (Suphian): removed pages like /podcast and any unknown URL go home. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
      <BrowserRouter>
        <UIProvider>
          <Shell />
        </UIProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
