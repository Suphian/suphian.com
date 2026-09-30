// Lighthouse CI guard (npm run lhci): mobile Lighthouse against the production bundle in dist/
// (run `npm run build` first; CI has just built it for e2e:prod). Local runs need Chrome
// (set CHROME_PATH if it is not found). Reports go to qa/lhci, which is gitignored.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npx vite preview --host 127.0.0.1 --port 4175 --strictPort',
      startServerReadyPattern: 'Local',
      url: ['http://127.0.0.1:4175/'],
      numberOfRuns: 1,
      settings: { chromeFlags: '--no-sandbox --headless=new' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
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
