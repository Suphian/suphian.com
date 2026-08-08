/// <reference types="vite/client" />

interface Window {
  gtag?: (key: string, ...args: unknown[]) => void;
  trackEvent?: (eventName: string, eventData?: Record<string, unknown>) => void;
}
