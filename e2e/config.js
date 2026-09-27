import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

// Absolute paths: Playwright resolves relative ones against whichever config file loads this.
const E2E_DIR = fileURLToPath(new URL('.', import.meta.url));
const ROOT = fileURLToPath(new URL('..', import.meta.url));

// Click-through smoke tests (e2e/). Headless Chromium only; never the user's browser.
//   npm run e2e       -> the running dev server (http://127.0.0.1:4173)
//   npm run e2e:prod  -> builds, serves the production bundle on :4174, tests that
//   npm run e2e:hmr   -> the dev-only hot-reload regression (edits a file, so alone)
//   E2E_BASE_URL=https://preview.example.com npm run e2e -> a deployed site (Supabase stays stubbed)
//   E2E_STORAGE_STATE=qa/preview-auth.json -> optional browser cookies for a protected preview
export function makeConfig({ preview = false, hmr = false } = {}) {
  const remoteURL = !hmr && process.env.E2E_BASE_URL?.trim();
  const baseURL = remoteURL ? new URL(remoteURL).origin : preview ? 'http://127.0.0.1:4174' : 'http://127.0.0.1:4173';
  return defineConfig({
    testDir: E2E_DIR,
    testMatch: hmr ? ['hmr.spec.js'] : ['smoke.spec.js', 'responsive.spec.js'],
    outputDir: `${ROOT}qa/e2e-results`,
    fullyParallel: true,
    retries: 0,
    reporter: [['list']],
    timeout: 45_000,
    expect: { timeout: 8_000 },
    metadata: { preview },
    use: { baseURL, storageState: process.env.E2E_STORAGE_STATE || undefined, headless: true, serviceWorkers: 'block', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
    projects: hmr
      ? [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }]
      : [
          { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
          { name: 'mobile', use: { ...devices['Pixel 7'] } },
        ],
    webServer: preview && !remoteURL
      ? { command: 'npx vite preview --host 127.0.0.1 --port 4174 --strictPort', cwd: ROOT, url: baseURL, reuseExistingServer: false, timeout: 60_000 }
      : undefined,
  });
}
