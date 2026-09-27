# Search and AI discoverability, 2026-09-26

Implemented the technical launch fixes. Search rankings, indexing and inclusion in AI answers cannot be guaranteed.

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

## Follow-up requiring account access or new content

Submit `https://suphian.com/sitemap.xml` in the existing verified Google Search Console and Bing Webmaster properties and inspect the homepage. Review actual impressions and queries after recrawling. Do not infer that a sitemap submission guarantees indexing.

For stronger AI-product relevance, Suphian can later supply a specific, factual Abacus case study explaining what AI does, his role, and demonstrated outcomes, then align his LinkedIn headline. No unsupported outcomes or deployment claims were added during launch.

## Primary references

- [Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) recommends rendering important content in HTML because some bots cannot execute JavaScript, and keeping canonicals stable.
- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) says the usual SEO fundamentals apply, important content should be textual, and no special AI files or schema are required.
- [Google: structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) requires accurate markup that represents reader-visible content.
- [OpenAI: crawler documentation](https://developers.openai.com/api/docs/bots) distinguishes OAI-SearchBot search discovery from GPTBot training controls.
