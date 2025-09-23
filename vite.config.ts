import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      // Security: Deny access to sensitive files and bypass patterns
      deny: [
        '.env*',
        '**/.env*',
        '**/node_modules/**',
        '**/.*',
        // Prevent known CVE bypass patterns
        '**/..',
        '**/../**',
        '/..',
        '/../**'
      ],
      strict: true
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
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
            // Core React bundle
            if (id.includes('react') || id.includes('react-dom')) return 'react';
            // UI library chunks
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('lucide-react')) return 'icons';
            // Third-party services
            if (id.includes('emailjs-com')) return 'email';
            if (id.includes('ua-parser-js')) return 'analytics-deps';
            // Router
            if (id.includes('react-router')) return 'router';
            // Query client
            if (id.includes('@tanstack/react-query')) return 'query';
            // Other vendor code
            return 'vendor';
          }
          // Analytics - completely separate and lazy loaded
          if (id.includes('/utils/analytics/') || 
              id.includes('/hooks/useEventTracker') ||
              id.includes('AnalyticsPageviewListener') ||
              id.includes('LazyAnalytics')) return 'analytics';
          // Heavy widgets - lazy loaded
          if (id.includes('/components/StreamingRevenueWidget') || 
              id.includes('/components/YouTubeMusicPlayer') ||
              id.includes('/components/EarningsChart') ||
              id.includes('/components/ComparisonTable')) return 'widgets';
          // Contact forms - lazy loaded
          if (id.includes('/components/ContactForm') ||
              id.includes('/components/ContactSheet') ||
              id.includes('/components/RequestCVModal')) return 'contact';
          // Section components - lazy loaded
          if (id.includes('/components/sections/')) return 'sections';
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
