// Lighthouse CI guard (npm run lhci): mobile Lighthouse against the production bundle in dist/
// (run `npm run build` first; CI has just built it for e2e:prod). Local runs need Chrome
// (set CHROME_PATH if it is not found). Reports go to qa/lhci, which is gitignored.
//
// CI vs local: shared 2-vCPU runners are several times slower than a dev machine, so Lighthouse's
// fixed 4x CPU slowdown stacks on top and the performance score both drops and flaps (PR #12: 0.66
// on CI vs 0.98 locally, same build). CI therefore takes the median of 3 runs, a lower floor
// (LHCI_PERF_MIN) and a smaller slowdown (LHCI_CPU_SLOWDOWN), see ci.yml. The other assertions are
// deterministic (bytes, console errors, a11y/best-practices/seo) and stay hard everywhere.
const perfMin = Number(process.env.LHCI_PERF_MIN) || 0.95;
const cpuSlowdown = Number(process.env.LHCI_CPU_SLOWDOWN);
const throttling = cpuSlowdown > 0 ? { cpuSlowdownMultiplier: cpuSlowdown } : {};

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npx vite preview --host 127.0.0.1 --port 4175 --strictPort',
      startServerReadyPattern: 'Local',
      url: ['http://127.0.0.1:4175/'],
      numberOfRuns: 3,
      settings: { chromeFlags: '--no-sandbox --headless=new', throttling },
    },
    assert: {
      aggregationMethod: 'median',
      assertions: {
        'categories:performance': ['error', { minScore: perfMin }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],
        'total-byte-weight': ['error', { maxNumericValue: 400 * 1024 }],
        'errors-in-console': ['error', { minScore: 1 }],
      },
    },
    upload: { target: 'filesystem', outputDir: 'qa/lhci' },
  },
};
