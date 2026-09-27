import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { crawlerResources, renderSeoHtml } from './scripts/seo.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

// All visitors receive the same readable profile and metadata before React
// enhances it. Text resources share the same approved copy as the homepage.
const staticSeo = () => {
  let isBuild = false;
  return {
    name: 'static-profile-and-seo',
    configResolved(config) { isBuild = config.command === 'build'; },
    transformIndexHtml: { order: 'pre', handler: renderSeoHtml },
    closeBundle() {
      if (!isBuild) return;
      for (const [name, contents] of Object.entries(crawlerResources())) {
        fs.writeFileSync(path.resolve(root, 'dist', name), contents);
      }
    },
  };
};

// Stamps a unique build id into the copied service worker so every deploy gets
// a fresh CACHE_NAME and old caches are evicted on activate (public/sw.js).
const injectServiceWorkerBuildId = () => ({
  name: 'inject-sw-build-id',
  apply: 'build',
  closeBundle() {
    const swPath = path.resolve(root, 'dist/sw.js');
    if (!fs.existsSync(swPath)) return;
    const buildId = Date.now().toString(36);
    fs.writeFileSync(swPath, fs.readFileSync(swPath, 'utf8').replace(/__SW_BUILD_ID__/g, buildId));
  },
});

// Same address as the package.json scripts, which also pass these as flags.
const address = { host: '127.0.0.1', port: 4173, strictPort: true };

// `vite preview` serves the production build with vercel.json's site-wide headers
// (CSP included), so the e2e suite runs under the exact policy production uses.
const vercelHeaders = Object.fromEntries(
  (JSON.parse(fs.readFileSync(path.resolve(root, 'vercel.json'), 'utf8')).headers
    .find((rule) => rule.source === '/(.*)')?.headers ?? [])
    .map(({ key, value }) => [key, value]),
);

export default defineConfig(({ mode }) => ({
  server: address,
  preview: { ...address, headers: vercelHeaders },
  plugins: [staticSeo(), injectServiceWorkerBuildId()],
  esbuild: {
    // console.error survives production so real failures stay observable.
    drop: mode === 'production' ? ['debugger'] : [],
    pure: mode === 'production' ? ['console.log', 'console.info', 'console.debug', 'console.warn'] : [],
  },
}));
