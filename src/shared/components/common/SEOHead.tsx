import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Canonical origin — keep in sync with vercel.json redirects and sitemap.xml.
const SITE_ORIGIN = 'https://suphian.com';

const DEFAULT_TITLE = 'Suphian Tweel · Senior Product Manager, YouTube';
const DEFAULT_DESCRIPTION =
  'Senior Product Manager at YouTube specializing in payments and AI. Builds AI-powered payment systems at scale — managing $6B+ in music payments, launching YouTube Shorts monetization, and leading AI-driven fraud detection.';
const DEFAULT_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

interface RouteMeta {
  title: string;
  description: string;
  breadcrumb?: string;
  robots?: string;
}

const ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  '/podcast': {
    title: 'Podcast · Suphian Tweel',
    description:
      "AI-generated podcast on Suphian Tweel's work: how GenAI helps solve YouTube's $20 billion payment problem.",
    breadcrumb: 'Podcast',
  },
};

// Unknown paths render the client-side 404; the SPA rewrite still returns
// HTTP 200, so noindex is the only signal crawlers get that this isn't a page.
const NOT_FOUND_META: RouteMeta = {
  title: 'Page Not Found · Suphian Tweel',
  description: DEFAULT_DESCRIPTION,
  robots: 'noindex, follow',
};

const updateMetaTag = (property: string, content: string) => {
  // OG and profile tags use property=; everything else (incl. twitter:*) uses name=
  const attr = property.startsWith('og:') || property.startsWith('profile:')
    ? 'property'
    : 'name';
  let meta =
    document.querySelector(`meta[property="${property}"]`) ||
    document.querySelector(`meta[name="${property}"]`);

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
};

const SEOHead = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = ROUTE_META[pathname] ?? NOT_FOUND_META;
    const canonicalUrl = pathname === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${pathname}`;

    document.title = meta.title;
    updateMetaTag('description', meta.description);
    updateMetaTag('robots', meta.robots ?? DEFAULT_ROBOTS);

    updateMetaTag('og:title', meta.title);
    updateMetaTag('og:description', meta.description);
    updateMetaTag('og:url', canonicalUrl);
    updateMetaTag('twitter:title', meta.title);
    updateMetaTag('twitter:description', meta.description);

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // BreadcrumbList is the only JSON-LD that varies per route. The static
    // Person/FAQ/WebSite/Organization blocks in index.html are the single
    // source of truth — they're what non-JS crawlers see anyway.
    const breadcrumbData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${SITE_ORIGIN}/`,
        },
        ...(meta.breadcrumb
          ? [
              {
                '@type': 'ListItem',
                position: 2,
                name: meta.breadcrumb,
                item: canonicalUrl,
              },
            ]
          : []),
      ],
    };

    let breadcrumbScript = document.querySelector('#structured-data-breadcrumb') as HTMLScriptElement;
    if (!breadcrumbScript) {
      breadcrumbScript = document.createElement('script');
      breadcrumbScript.id = 'structured-data-breadcrumb';
      breadcrumbScript.type = 'application/ld+json';
      document.head.appendChild(breadcrumbScript);
    }
    breadcrumbScript.textContent = JSON.stringify(breadcrumbData);
  }, [pathname]);

  return null;
};

export default SEOHead;
