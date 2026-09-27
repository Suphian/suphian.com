import { useEffect } from 'react';
import { seo } from '../content.js';

// The single-page portfolio redirects legacy/unknown paths home. Keep its
// canonical and robots tags stable throughout that client-side redirect.
export function useSeo() {
  useEffect(() => {
    document.title = seo.home.title;
  }, []);
}
