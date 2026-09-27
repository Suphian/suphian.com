import { serviceWorker as copy } from '../content.js';

// Ported from suphian.com shared/utils/serviceWorker.ts. Registered in PROD only.
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/),
);

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return undefined;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    if (isLocalhost) {
      await navigator.serviceWorker.ready;
      console.log('Service worker registered successfully');
    }
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          if (window.confirm(copy.updatePrompt)) window.location.reload();
        }
      });
    });
    return registration;
  } catch (error) {
    if (isLocalhost) console.error('Service worker registration failed:', error);
    return undefined;
  }
}

export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) await registration.unregister();
  } catch (error) {
    console.error('Service worker unregistration failed:', error);
  }
}
