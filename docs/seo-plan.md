# Search and AI discoverability, 2026-09-26

Implemented the technical launch fixes. Search rankings, indexing and inclusion in AI answers cannot be guaranteed.

## 2026-09-27: identity first, and a production audit

Suphian: "The Steadily thing isn't a big part of my identity. It's just my role, so I don't want to optimize too much for that." Branch `feat/seo-identity`; not yet deployed. This supersedes the launch note below that the description names Steadily.

### What changed

- **Description** (meta, OG, Twitter, manifest, all three JSON-LD entities, llms summary). Before: "Principal Product Manager at Steadily. Previously led payments at YouTube. Builds side projects with Abacus Labs and suph.app." (126 characters). After: "Product leader. Led payments at YouTube, 2020 – 2026. Builds Abacus Labs, a command center for MCA operators, and something new every month at suph.app." (152 characters). Every phrase comes from the approved chapters. It makes no AI claim, because the "no AI at YouTube" guard applies and no Abacus AI facts have been supplied yet.
- **`hero.srTitle`** (the rendered page's only h1, visually hidden): now "Suphian Tweel. Product leader. Previously led payments at YouTube. Builds Abacus Labs and suph.app."
- **Title** unchanged: "Suphian Tweel · Product, Payments & AI" already leads with the positioning and matches the social card, which never named Steadily.
- **JSON-LD:** Steadily stays `worksFor`/`jobTitle` because it is accurate. It no longer leads any description. The Person gains `affiliation` Abacus Labs, an affiliation only, with no founder or owner claim. The Person and WebSite `url` are now the canonical `https://suphian.com/`; they previously omitted the trailing slash. The ProfilePage gains `dateModified`.
- **Sitemap `<lastmod>`** now comes from `seo.lastModified` (2026-09-27), which is shared with `dateModified`. Bump it only when homepage copy or metadata changes. If this branch ships on a later day, set it to the deploy date.
- **Tests:** `tests/seo.test.mjs` fails if Steadily enters the title, or if it appears before the YouTube and Abacus facts in the description, h1 or llms summary. It also checks the 120–160-character description length, canonical entity URLs, resolving `@id` references, and matching sitemap and ProfilePage dates.
- **Proposal commit (droppable):** `site.title` is the line under the name in the no-JavaScript profile, which non-rendering AI crawlers read first, and in `humans.txt`. It is visible copy, so it has its own commit.

### Production audit (curl, 2026-09-27, live `main` before this branch)

| Check | Result |
|---|---|
| `https://suphian.com` | 200, no redirect |
| `http://suphian.com` | 308 → `https://suphian.com/` (1 hop) |
| `https://www.suphian.com` | 308 → `https://suphian.com/` (1 hop; paths preserved) |
| `http://www.suphian.com` | 308 → `https://www.suphian.com/` → 308 → apex (2 hops: Vercel's HTTPS upgrade runs first) |
| `suph.ai`, `www.suph.ai` | 308 → `https://suphian.com/` (1 hop) |
| `/robots.txt` | 200 `text/plain`; allows all, OAI-SearchBot explicit, Sitemap line |
| `/sitemap.xml` | 200 `application/xml`; one URL, `lastmod` 2026-09-26 (accurate for launch) |
| `/llms.txt`, `/llms-full.txt` | 200 `text/plain`; still the Steadily-first summary until this branch ships |
| OG image `/og/suphian.png` | 200 `image/png`, 1200×630 (matches the meta), 506 KB |
| `/site.webmanifest`, icons | 200 `application/manifest+json`; favicon.ico, 32 px, apple-touch, 192, 512 and maskable 512 all 200 `image/*` |
| Headers | No `X-Robots-Tag` anywhere. HTML, text files and OG image: `max-age=0, must-revalidate`; `/assets` immutable for 1 year; icons 1 day; fonts 7 days. CSP, HSTS (2 years, includeSubDomains), nosniff and `X-Frame-Options: DENY` present |
| Canonical, `og:url` | One canonical; both `https://suphian.com/` |
| JSON-LD | One block; parses; Person, WebSite, ProfilePage; every `@id` reference resolves; `sameAs` LinkedIn and GitHub |
| On-page (initial HTML) | One title; 26 meta tags, no duplicates; `theme-color` #080808; one h1, no skipped heading levels; 16 links, all descriptive; no hreflang (single language, not needed) |
| On-page (rendered) | One h1 (`srTitle`); card logos are decorative (`alt=""` inside an `aria-hidden` card beside the visible name) |
| `/does-not-exist` | **200** `text/html`, byte-identical to the homepage (soft-404 risk; see below) |
| `/podcast` | 308 → `/` |

### Lighthouse (13.5.0, mobile preset, headless, local `vite preview` with vercel.json headers, three runs each)

| | Performance | SEO | Accessibility | Best practices | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Before | 95 | 100 | 100 | 100* | 1.9 s | 2.7 s | 20 ms | 0 |
| After | 95 | 100 | 100 | 100 | 1.9 s | 2.7 s | 20–50 ms | 0 |

\*One run scored 96 because of a local `ERR_NO_BUFFER_SPACE` network error, not the site. The top opportunities are unchanged by this metadata-only work:
1. Render-blocking CSS: the 6.7 KB main stylesheet has an estimated 600 ms FCP/LCP saving in simulation.
2. Unused JavaScript: about 33 KiB of the 93 KiB main bundle is unused at load.
3. `PPNeueMontreal-Semibold.woff2` (93 KB): it sits at the end of the longest request chain because it is discovered through the CSS, and only Regular is preloaded.

The LCP element is the "Scroll for the story" cue.

### Recommended hosting changes (vercel.json is owned elsewhere, so none were made)

1. **Soft 404s.** The catch-all rewrite returns 200 and the homepage for every unknown path. The single canonical limits the damage, but Google may report soft 404s. To keep Suphian's "no dead pages" rule while sending crawlers a real status, drop the catch-all rewrite (the app's only route is `/`) and have the build copy `dist/index.html` to `dist/404.html`. Vercel then serves unknown paths with HTTP 404 and the full homepage, and the app still moves visitors to `/` (`src/main.jsx`). Do not redirect every unknown path home; Google also treats that as a soft 404.
2. **OG image caching.** Add a `Cache-Control` rule for `/og/(.*)` like the icons (`public, max-age=86400, stale-while-revalidate=604800`).
3. **`http://www` hop.** The two-hop chain comes from Vercel's HTTPS upgrade and cannot be fixed with `vercel.json` redirects. It is harmless. Optionally, set `www.suphian.com` to redirect at the Vercel domain level.

### Owner-only follow-up

- **Bing Webmaster Tools:** sign in, add the site (importing from Google Search Console is the quickest route), then submit `https://suphian.com/sitemap.xml`. Bing's index also serves Microsoft Copilot.
- **Abacus case study:** supply real facts: what Abacus does, where AI is involved (if at all), Suphian's role, and outcomes that can be shown. Until then, no AI or outcome claims are made for Abacus.
- **LinkedIn headline:** align it with the new positioning, for example product leader, formerly payments at YouTube, building Abacus Labs, so that search engines and AI assistants see one consistent identity.
- **Search Console, around 2026-10-04 to 10-11:** after the deploy, use URL Inspection on `https://suphian.com/` to request reindexing, then check that the new description is indexed. Also review Pages → "Not indexed" for soft 404s, and review queries and impressions.
- **Social previews:** after the deploy, re-scrape the homepage in LinkedIn's Post Inspector so shares pick up the new description. The 506 KB card is fine for most platforms. If a messenger (WhatsApp is often cited) drops the image, re-export it under about 300 KB.

## Findings and changes

- The old initial response had an empty React root and a JavaScript-required notice. Vite now generates a readable homepage with Suphian's approved intro, all six work/side-project summaries, reference links, and a working email link. Every visitor receives the same HTML; no crawler detection is used. React enhances the page into the existing design. A two-second fallback reveals the readable document if the application bundle fails.
- Metadata and JSON-LD now come from `src/content.js`, rather than a second stale copy in `index.html`. The title uses the existing Product / Payments / AI positioning. The description names Steadily, past YouTube payments work and current side projects without inventing AI work at YouTube.
- Removed the stale Gmail address, unsupported `ai:*` metadata, invisible FAQ markup, personal Organization markup, and astronaut image used as a person's portrait. Connected Person, WebSite and ProfilePage entities share stable IDs. The current social image is `/og/suphian.png`.
- Kept a single homepage canonical and one sitemap URL: the work chapters are in-page dialogs, not separate pages. Legacy URLs still follow the existing home redirect behavior.
- Simplified `robots.txt`, explicitly allowing OAI-SearchBot and preserving the existing permissive policy for other crawlers. Removed crawl-delay rules. Robots rules do not override hosting/firewall restrictions.
- Regenerated `llms.txt` and `llms-full.txt` from approved content, removing unsupported AI/ML deployment claims, annual payment claims and outdated project copy. These are optional plain-text conveniences; they are not a requirement for Google AI features.
- Removed unused resume/audio/404 content and the dead NotFound component. Visible headline, intro, chapter content and interactions are unchanged.

## Verification and maintenance

`npm test` includes checks that initial HTML contains every approved summary/link, contact details match, JSON-LD is valid, social artwork exists, and published crawler resources match the source of truth. The production build emits the same resources automatically. After changing content, run `node scripts/sync-seo.mjs` to update checked-in public resources and manifest text.

Browser QA should verify normal rendering, no-JavaScript readability and bundle-load failure recovery. After deployment, verify the root, robots, sitemap, social card and text resources return HTTP 200, with no production `noindex` header.

## Search Console result and remaining follow-up

Created the Google Search Console URL-prefix property `https://suphian.com/` in the owner's signed-in Google account after production launch. Ownership auto verified through the existing domain-provider DNS-CNAME record; no new verification token or site deployment was needed. Keep that DNS verification record in place.

Submitted `https://suphian.com/sitemap.xml`. Google first accepted the submission, then the sitemap detail showed **Sitemap processed successfully**, last read **9/26/26**, **1 discovered page** and **0 videos**. An initial temporary "Couldn't fetch" status resolved without resubmission. This confirms sitemap processing, not homepage indexing or ranking. Review actual impressions and queries after recrawling.

Bing Webmaster Tools has no authenticated session. Its Google sign-in flow requests a new connection allowing access to the owner's name, profile picture and email. Stopped before granting that connection or creating an account. Bing verification and sitemap submission remain owner-dependent.

For stronger AI-product relevance, Suphian can later supply a specific, factual Abacus case study explaining what AI does, his role, and demonstrated outcomes, then align his LinkedIn headline. No unsupported outcomes or deployment claims were added during launch.

## Primary references

- [Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) recommends rendering important content in HTML because some bots cannot execute JavaScript, and keeping canonicals stable.
- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) says the usual SEO fundamentals apply, important content should be textual, and no special AI files or schema are required.
- [Google: structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) requires accurate markup that represents reader-visible content.
- [OpenAI: crawler documentation](https://developers.openai.com/api/docs/bots) distinguishes OAI-SearchBot search discovery from GPTBot training controls.
