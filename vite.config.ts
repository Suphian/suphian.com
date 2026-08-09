import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { visualizer } from "rollup-plugin-visualizer";

// Stamps a unique build id into the copied service worker so every production
// deploy gets a fresh CACHE_NAME and old caches are evicted on activate.
const injectServiceWorkerBuildId = () => ({
  name: "inject-sw-build-id",
  apply: "build" as const,
  closeBundle() {
    const swPath = path.resolve(__dirname, "dist/sw.js");
    if (fs.existsSync(swPath)) {
      const buildId = Date.now().toString(36);
      const contents = fs.readFileSync(swPath, "utf8").replace(/__SW_BUILD_ID__/g, buildId);
      fs.writeFileSync(swPath, contents);
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080,
  },
  plugins: [
    react(),
    // `npm run build:analyze` emits an interactive bundle treemap to dist/stats.html
    mode === 'analyze' && visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      open: false,
    }),
    injectServiceWorkerBuildId(),
  ].filter(Boolean),
  esbuild: {
    // console.error survives to production so ErrorBoundary/audio failures
    // are still observable; the noisy levels are stripped as pure calls.
    drop: mode === 'production' ? ['debugger'] : [],
    pure: mode === 'production'
      ? ['console.log', 'console.info', 'console.debug', 'console.warn']
      : [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Order matters: match specific packages BEFORE the generic React core
            // check, because most of these package paths also contain "react"
            // (e.g. @radix-ui/react-*, lucide-react) and would otherwise be
            // swallowed into the vendor chunk.
            if (id.includes('/react-router') || id.includes('/@remix-run/')) return 'router';
            if (id.includes('/react-hook-form') || id.includes('/@hookform/')) return 'forms';
            if (id.includes('/@radix-ui/')) return 'radix';
            if (id.includes('/lucide-react/')) return 'icons';
            if (id.includes('/ua-parser-js/')) return 'analytics';
            // Styling foundations are shared by eager AND lazy chunks; without
            // an explicit home Rollup colors them into a lazy chunk, which then
            // becomes a static dependency of the entry (defeating the split).
            if (id.includes('/class-variance-authority/') || id.includes('/clsx/') ||
                id.includes('/tailwind-merge/')) return 'vendor';
            // React core (loaded on every route) gets a stable vendor chunk.
            if (id.includes('/react/') || id.includes('/react-dom/') ||
                id.includes('/react-is/') || id.includes('/scheduler/')) return 'vendor';
            // Everything else (e.g. @supabase) is left to Rollup so it
            // stays code-split with the lazy route that uses it.
            return undefined;
          }
          // Vite's dynamic-import preload helper is referenced by every chunk;
          // pin it to vendor so it can't drag a lazy chunk into the entry graph.
          if (id.includes('vite/preload-helper')) return 'vendor';
          // Shared UI foundations used by both eager chrome (Toaster) and the
          // lazy contact chunk — same coloring problem as above. They import
          // from the radix chunk, so they need their own chunk (putting them in
          // vendor would create a vendor<->radix cycle that breaks React init).
          if (id.includes('/shared/lib/utils') ||
              id.includes('/shared/hooks/use-toast') ||
              id.includes('/shared/components/ui/toast')) return 'ui-shared';
          // Split analytics utilities into separate chunk - load only when
          // needed. useEventTracker deliberately stays out: it's imported
          // statically by eager pages, so putting it here would drag the whole
          // analytics chunk into the entry's static import graph.
          if (id.includes('/shared/utils/analytics/')) return 'analytics';
          // Split contact forms into separate chunk
          if (id.includes('/features/contact/components/ContactForm') ||
              id.includes('/features/contact/components/ContactSheet') ||
              id.includes('/features/landing/components/RequestCVModal')) return 'contact';
        },
        // Optimize asset naming for better caching
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return `assets/[name]-[hash][extname]`;
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(extType)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    }
  }
}));
