# Physics-wordmark launch

The owner authorized replacing suphian.com with the local redesign on 2026-09-26. The original handoff was suphian-scroll-demo 8815f8e; launch preparation is saved there as 87bf955. The production repository launch branch begins at 40f1576 and includes the two prepared contact-email commits.

## Deployed result

The launch PR #9 merged as 6ddf31a. The final production code is 91c2d1e, deployed READY as dpl_9s3PUVFuhNj2DNnTXhCcZbLXuKcH (https://suphian-9nuhskdxh-suph.vercel.app) and serving https://suphian.com. The single real preview contact submission saved one row (201), returned both email-provider IDs (200), and showed UI success. Rebranded notify-contact-submit is ACTIVE version 36 with JWT verification enabled. No second real contact send was made.

Production checks found an omitted Google Analytics connection host and a missing explicit www.suph.ai root redirect. The deployed follow-up adds only stats.g.doubleclick.net to connect-src, preserving existing analytics behavior, and explicitly redirects that hostname's root. The Analytics connection works and www.suph.ai now returns a 308 to the canonical domain. Google documents this Analytics endpoint family at https://developers.google.com/tag-platform/security/guides/csp .

## Verification

- Clean npm ci: zero reported vulnerabilities in the new dependency tree.
- Final unit suite: 139 passed.
- Local production browser suite: 41 passed, 13 intentional platform-specific skips; 11 responsive sizes covered.
- Live production browser suite: 41 passed, 13 intentional platform-specific skips; 11 responsive sizes covered, with zero console-ignore exceptions.
- No-JavaScript view: six approved work summaries and contact links readable.
- JavaScript view: original animated design, one H1, six story controls, no application errors.
- Final GitHub CI run 36283363619 succeeded for 91c2d1e.
- Preview: https://suphian-88nob0sit-suph.vercel.app (protected).
- Preview HTTP checks: homepage, robots, sitemap, llms text, social card and email icon all return 200 with expected content types. The removed font PDF returns the site's HTML fallback, not PDF bytes.

The protected preview injects Vercel's feedback toolbar, which the production CSP blocks. Remote test runs may set E2E_IGNORE_VERCEL_TOOLBAR_CSP=1 to record and ignore only the exact toolbar-script CSP warning on vercel.app hosts. Application errors still fail tests; production checks do not use this exception.

## Production and email rollout

Merged the launch pull request after deployed browser checks and the authorized real form send passed. GitHub's Vercel integration deployed main. Deployed notify-contact-submit to Supabase with existing JWT verification and secrets. The form saves a database row before requesting mail; the single real preview send returned both provider IDs. Inbox arrival was not independently confirmed.

Original production rollback target: https://suphian-mmj2nraub-suph.vercel.app (dpl_9pZWAD18kZjY6aWNJVJxpDtuR4LZ, Git commit 47c64f7). Keep this deployment available. Run vercel rollback with that URL from the linked project if needed, then revert the corresponding Git changes to align subsequent builds.

## Remaining account/file-dependent items

Google Search Console's https://suphian.com/ URL-prefix property was created after launch and auto verified through the existing domain-provider DNS-CNAME record. The production sitemap was submitted and Google subsequently reported "Sitemap processed successfully", last read 9/26/26, with 1 discovered page and 0 videos. This confirms sitemap processing, not indexing or rankings. Preserve the existing DNS verification record.

Bing Webmaster remains pending: Google sign-in requests a new connection for name/profile picture/email, so no new connection or account was created. Complete that account step and submit https://suphian.com/sitemap.xml when the owner is ready.

The owner confirmed the font license. The supplied Semibold remains in place of Medium because no Medium file was available. The trial-license PDF and retired artwork are outside public deployment output.

## Analytics

GA4 (G-8S5FL37K8X, index.html) and PostHog run side by side. src/lib/analytics.js sends each custom event below to PostHog and, where gtag has loaded, to GA4 under the same name and properties. Both run on suphian.com only (not dev, previews or local builds) and load after the first interaction or 3s, so neither touches first paint.

PostHog is off until its key is in. Paste the project API key (phc_…, PostHog > Project settings) into POSTHOG_KEY in src/lib/analytics.js; that one line is the switch. While it is empty nothing loads and nothing is sent, the GA4 copies of these events included. For an EU project, also set POSTHOG_REGION to 'eu' and point the three /ingest rewrites in vercel.json at eu-assets.i.posthog.com and eu.i.posthog.com; npm test checks the two agree.

Events go to suphian.com/ingest, which vercel.json rewrites to PostHog US ahead of the SPA fallback, so ad blockers keep them and the CSP needs no PostHog host. The service worker never touches /ingest. posthog-js is a lazy chunk with autocapture, page-leave, heatmaps, web vitals (GA4 has them), session replay, surveys, remote config and remote scripts all off; person profiles are created only for identified visitors, which is nobody today.

- $pageview: once per page load.
- story_chapter_opened { chapter }: a work or side-project chapter opens; chapter is its content.js id, e.g. steadily.
- outbound_link_clicked { href, label, chapter? }: a chapter's links, with chapter, and the footer's Email (Gmail), LinkedIn and GitHub links.
- say_hello_clicked: the SAY HELLO sign-off.
- contact_opened { source }: the contact sheet opens; source is SayHello, its only opener.
- contact_submitted { status }: sent, rate_limited, error, dry_run (local) or blocked (honeypot). Never the message, name, email or phone.
- email_link_clicked: the footer's hello@suphian.com mailto link.
- section_viewed { section }: story, say_hello or footer, once each per load, when half the section (or half the screen, for a taller one) is in view.

GA4 reports can break events down by chapter, href, label, source, status and section once those are registered as event-scoped custom dimensions in the GA4 admin.

To watch events anywhere, run localStorage.setItem('analytics-debug', '1') in the browser console and reload: analytics then runs on any host, the key still required, and PostHog logs each event to the console. localStorage.removeItem('analytics-debug') turns it off. Vercel deployments, previews included, proxy /ingest to PostHog for real; locally those requests 404. PostHog drops automated browsers (navigator.webdriver), so Playwright runs never reach it.
