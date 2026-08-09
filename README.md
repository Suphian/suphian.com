# suphian.com

Personal portfolio of Suphian Tweel — Senior Product Manager at YouTube.

**Live**: [suphian.com](https://suphian.com)

## Stack

- [Vite](https://vitejs.dev) + React 18 + TypeScript
- Tailwind CSS + shadcn/ui (Radix primitives)
- React Router (client-side SPA)
- Supabase (contact form storage, edge function email via Resend, first-party analytics)
- Google Analytics 4 (deferred until first interaction)
- Deployed on Vercel

## Development

```sh
npm install
npm run dev            # dev server on :8080
npm run lint           # eslint
npm run build          # production build to dist/
npm run preview:local  # serve the production build on :8080
npm run build:analyze  # bundle treemap at dist/stats.html
npm run optimize:images  # regenerate derivatives in public/ from assets-src/
```

## Repo notes

- `assets-src/` holds editable image masters; everything in `public/` ships to the CDN verbatim, so only optimized derivatives live there (`scripts/optimize-images.mjs` generates them).
- `supabase/` contains the `notify-contact-submit` edge function and database migrations.
- SEO: static meta + JSON-LD in `index.html` is the single source of truth for crawlers; `src/shared/components/common/SEOHead.tsx` updates title/canonical/OG per route at runtime.
- Deployment: pushes to `main` go to production via Vercel. See `CONTRIBUTING.md` — verify on a preview deployment first.
