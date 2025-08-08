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
            if (id.includes('react') || id.includes('react-dom')) return 'vendor';
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('lucide-react')) return 'icons';
          }
        }
      }
    }
  }
}));
