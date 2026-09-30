// Uncaught errors and unhandled promise rejections to PostHog Error Tracking,
// through posthog.captureException (analytics.js queues them until PostHog
// loads; posthogExceptions.js turns them into $exception events). Noise that
// says nothing about this site is dropped, repeats are folded, and a page sends
// at most MAX_PER_PAGE, so one broken loop can't flood the project.
//
// React error boundaries catch render errors before any window error event (in
// production React only logs them), so ErrorBoundary.jsx and SayHelloSlot.jsx's
// KeepBox report theirs with boundaryReport, and lazy chunks that fail to load
// are marked by importWithRetry so those reports say lazy-chunk.

// The same message and stack again within this window is the same failure.
const DEDUPE_MS = 60 * 1000;
const MAX_PER_PAGE = 10;

// Browser noise: ResizeObserver's benign loop warning (Chrome and Firefox
// wordings), and a cross-origin script's error, which the browser reduces to
// "Script error." with no stack, file or line to act on.
const RESIZE_OBSERVER = /^ResizeObserver loop/;
const CROSS_ORIGIN = /^Script error\.?$/;
// Browser extensions run their own scripts in the page. PostHog drops these too
// (posthog-js lib/src/posthog-exceptions.js EXTENSION_URL_PREFIXES; Safari's
// safari-extension: and safari-web-extension: have no //).
const EXTENSION_FRAME = /\b(chrome|moz)-extension:\/\/|\bsafari-(web-)?extension:/;

const text = (value) => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

/**
 * What an error or unhandledrejection event reports: the thing to capture (the
 * Error if there is one; the ErrorEvent itself otherwise, which PostHog turns
 * into a location stack; or the rejection reason as is), plus its message,
 * stack and file for filtering and dedupe.
 */
export function normalizeErrorEvent(event) {
  if (event?.type === 'unhandledrejection') {
    const reason = event.reason;
    const isError = reason instanceof Error || (typeof reason?.message === 'string' && typeof reason?.stack === 'string');
    return {
      input: reason,
      message: isError ? String(reason.message) : text(reason),
      stack: isError ? String(reason.stack ?? '') : '',
      filename: '',
      source: 'unhandledrejection',
    };
  }
  const error = event?.error;
  return {
    input: error ?? event,
    message: String(error?.message ?? event?.message ?? ''),
    stack: typeof error?.stack === 'string' ? error.stack : '',
    filename: String(event?.filename ?? ''),
    source: 'error',
  };
}

/** Noise: nothing in it points at this site's code. */
export function isNoise({ message, stack, filename }) {
  if (RESIZE_OBSERVER.test(message)) return true;
  if (CROSS_ORIGIN.test(message) && !stack) return true;
  return EXTENSION_FRAME.test(stack) || EXTENSION_FRAME.test(filename);
}

/**
 * Listens for error and unhandledrejection on deps.target (window) and hands
 * capture(input, { source }) each one worth sending: noise dropped, the same
 * message and stack once per minute, ten per page at most. deps.now is the
 * clock. Returns a function that removes the listeners. Never throws: error
 * tracking must not become the error.
 */
export function installErrorTracking(capture, deps) {
  const { target, now } = deps;
  const lastSent = new Map();
  let sent = 0;

  const onEvent = (event) => {
    try {
      if (sent >= MAX_PER_PAGE) return;
      const report = normalizeErrorEvent(event);
      if (isNoise(report)) return;
      const key = `${report.message}\n${report.stack}`;
      const time = now();
      const last = lastSent.get(key);
      if (last !== undefined && time - last < DEDUPE_MS) return;
      lastSent.set(key, time);
      sent += 1;
      capture(report.input, { source: report.source });
    } catch {
      // Dropped.
    }
  };

  target.addEventListener('error', onEvent);
  target.addEventListener('unhandledrejection', onEvent);
  return () => {
    target.removeEventListener('error', onEvent);
    target.removeEventListener('unhandledrejection', onEvent);
  };
}

// Errors from lazy chunks that failed to load, so a boundary can tell them from render errors.
const chunkErrors = new WeakSet();

/** Marks error as a failed chunk load (boundaryReport then says lazy-chunk) and returns it. */
export function markChunkError(error) {
  if (error !== null && (typeof error === 'object' || typeof error === 'function')) chunkErrors.add(error);
  return error;
}

/**
 * A lazy chunk's import(), retried once after a pause (flaky networks, a deploy
 * mid-session). If the retry fails too, it rejects with the error marked as a
 * chunk load failure. wait is the pause, which the tests replace.
 */
export function importWithRetry(load, { delay = 1500, wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  return load()
    .catch(() => wait(delay).then(load))
    .catch((error) => {
      throw markChunkError(error);
    });
}

/**
 * captureException's arguments for an error a React error boundary caught:
 * source lazy-chunk for a chunk that failed to load (importWithRetry), react
 * for anything else, with React's component stack.
 */
export function boundaryReport(error, info) {
  return [error, { source: chunkErrors.has(error) ? 'lazy-chunk' : 'react', componentStack: info?.componentStack ?? undefined }];
}
