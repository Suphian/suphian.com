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

// Vercel serves dist/404.html, with a real 404 status, for any path nothing else
// matches. It is the full profile, so a mistyped URL still lands on the site and
// the app sends it home, while search engines stop seeing every path as a
// duplicate homepage (a soft 404).
const notFoundPage = () => ({
  name: 'not-found-page',
  apply: 'build',
  closeBundle() {
    fs.copyFileSync(path.resolve(root, 'dist/index.html'), path.resolve(root, 'dist/404.html'));
  },
});

// The two font files are imported by src/fonts.css, so Vite emits them hashed into /assets.
// Preload both (Regular for the first paint, Semibold for the headings) from the built bundle,
// where the hashed names are known. Replaces the `<!-- fonts:preload -->` marker in index.html.
const preloadFonts = () => ({
  name: 'preload-fonts',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      const names = Object.keys(ctx.bundle ?? {})
        .filter((file) => /PPNeueMontreal-(Regular|Semibold)-[\w-]+\.woff2$/.test(file))
        .sort();
      if (names.length !== 2) throw new Error(`preload-fonts: expected Regular and Semibold in the bundle, found ${names.length}`);
      const links = names.map((file) => `<link rel="preload" href="/${file}" as="font" type="font/woff2" crossorigin />`);
      return html.replace('<!-- fonts:preload -->', links.join('\n    '));
    },
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
  plugins: [staticSeo(), preloadFonts(), injectServiceWorkerBuildId(), notFoundPage()],
  esbuild: {
    // console.error survives production so real failures stay observable.
    drop: mode === 'production' ? ['debugger'] : [],
    pure: mode === 'production' ? ['console.log', 'console.info', 'console.debug', 'console.warn'] : [],
  },
}));
