import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080,
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
            if (id.includes('react') || id.includes('react-dom')) return 'vendor';
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('emailjs-com')) return 'email';
            if (id.includes('ua-parser-js')) return 'analytics';
          }
          // Split analytics utilities into separate chunk - load only when needed
          if (id.includes('/utils/analytics/') || 
              id.includes('/hooks/useEventTracker') ||
              id.includes('AnalyticsPageviewListener')) return 'analytics';
          // Split heavy components into separate chunks
          if (id.includes('/components/StreamingRevenueWidget') || 
              id.includes('/components/YouTubeMusicPlayer') ||
              id.includes('/components/EarningsChart') ||
              id.includes('/components/ComparisonTable')) return 'widgets';
          // Split contact forms into separate chunk
          if (id.includes('/components/ContactForm') ||
              id.includes('/components/ContactSheet') ||
              id.includes('/components/RequestCVModal')) return 'contact';
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
