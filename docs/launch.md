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

Original production rollback target: https://suphian-mmj2nraub-suph.vercel.app (dpl_9pZWAD18kZjY6aWNJVJxpDtuR4LZ, Git commit 47c64f7). Keep this deployment available. Run vercel rollback with that URL from the linked project if needed, then revert the corresponding Git changes to align subsequent builds. For the redesigned site itself, use Vercel Instant Rollback to the previous production deployment rather than a hard-coded ID.

## Remaining account/file-dependent items

Google Search Console's https://suphian.com/ URL-prefix property was created after launch and auto verified through the existing domain-provider DNS-CNAME record. The production sitemap was submitted and Google subsequently reported "Sitemap processed successfully", last read 9/26/26, with 1 discovered page and 0 videos. This confirms sitemap processing, not indexing or rankings. Preserve the existing DNS verification record.

Bing Webmaster remains pending: Google sign-in requests a new connection for name/profile picture/email, so no new connection or account was created. Complete that account step and submit https://suphian.com/sitemap.xml when the owner is ready.

The owner confirmed the font license. The supplied Semibold remains in place of Medium because no Medium file was available. The trial-license PDF and retired artwork are outside public deployment output.

## Analytics

PostHog is the only analytics; GA4 (G-8S5FL37K8X) has been removed. src/lib/analytics.js sends every event below to PostHog. It runs on suphian.com only (not dev, previews or local builds). posthog-js loads after the first paint (load, first contentful paint, then idle, 2s at most), so it never touches first paint, and it does not wait for an interaction, so visits that never scroll or click are counted. It loads once the page has finished loading and the browser is idle (the idle wait is capped at 2s), so visits that end before that point are not counted, and on a slow connection that takes longer.

PostHog is live since 2026-09-27 (main f053793): POSTHOG_KEY in src/lib/analytics.js holds the key for the Suph.ai org's project 631302 (US), kept separate from the Honest Funding project. Emptying that one line switches it off again; with it empty nothing loads and nothing is sent. For an EU project, also set POSTHOG_REGION to 'eu' and point the three /ingest rewrites in vercel.json at eu-assets.i.posthog.com and eu.i.posthog.com; npm test checks the two agree.

Events go to suphian.com/ingest, which vercel.json rewrites to PostHog US ahead of the SPA fallback, so ad blockers keep them and the CSP needs no PostHog host. The CSP's report-uri sends violation reports to /ingest/report/, PostHog's CSP tracking. The service worker never touches /ingest. posthog-js is a lazy chunk, its slim build, with autocapture, heatmaps, session replay, surveys, remote config and remote scripts all off. Its own web vitals need remote config and a remote script, so src/lib/webVitals.js sends $web_vitals in the same format instead. Person profiles are created only for identified visitors, which is nobody today.

- $pageview: once per page load, with the time the page loaded.
- $pageleave: when the visitor leaves; $prev_pageview_duration is the seconds on the page and $prev_pageview_max_scroll_percentage the deepest scroll.
- $web_vitals: CLS, FCP, INP and LCP as $web_vitals_<NAME>_value and $web_vitals_<NAME>_event, sent 5s after the first metric, once all four are in, or when the page is hidden. CLS and INP usually arrive on hide, in a second event.
- $exception { $exception_list, source }: an uncaught error (source error), an unhandled promise rejection (unhandledrejection) or a failed app mount (mount). See Error tracking below.
- story_chapter_opened { chapter }: a work or side-project chapter opens; chapter is its content.js id, e.g. steadily.
- outbound_link_clicked { href, label, chapter? }: a chapter's links, with chapter, and the footer's Email (Gmail), LinkedIn and GitHub links.
- say_hello_clicked: the SAY HELLO sign-off.
- contact_opened { source }: the contact sheet opens; source is SayHello, its only opener.
- contact_submitted { status }: sent, rate_limited, error, dry_run (local) or blocked (honeypot). Never the message, name, email or phone.
- email_link_clicked: the footer's hello@suphian.com mailto link.
- section_viewed { section }: story, say_hello or footer, once each per load, when half the section (or half the screen, for a taller one) is in view.

To watch events anywhere, run localStorage.setItem('analytics-debug', '1') in the browser console and reload: analytics then runs on any host, the key still required, and PostHog logs each event to the console. localStorage.removeItem('analytics-debug') turns it off. Vercel deployments, previews included, proxy /ingest to PostHog for real; locally those requests 404. PostHog drops automated browsers (navigator.webdriver), so Playwright runs never reach it.

### Error tracking

src/lib/errors.js listens for uncaught errors and unhandled promise rejections from the start of src/main.jsx, wherever analytics runs (suphian.com, or the debug flag), and sends each through posthog.captureException as an $exception event with the error type, message and stack frames. It drops browser noise: ResizeObserver loop warnings, a cross-origin "Script error." with no stack, and anything with a chrome-extension:// or moz-extension:// frame. The same message and stack is sent at most once a minute, and a page sends at most 10. Errors before PostHog loads wait in the queue and go out once it does. See them in PostHog under Error Tracking (project 631302).

posthog-js's own exception autocapture (capture_exceptions) needs a remote script, so it stays off. The slim build also ships without the extension captureException needs, so src/lib/posthogExceptions.js supplies a small one built on PostHog's @posthog/core error builder.

Source maps: the build writes hidden source maps, and the postbuild step (scripts/upload-sourcemaps.mjs) uploads them with posthog-cli when POSTHOG_CLI_API_KEY is set, then deletes every .map in dist, so none is deployed. Without the key it prints "uploads skipped" and stack traces in PostHog stay minified. The one owner step: in PostHog, create a personal API key with the error_tracking:write, organization:read and project:read scopes, then add it as POSTHOG_CLI_API_KEY in Vercel's environment variables (Production and Preview) and as a GitHub Actions secret of the same name. Never commit it. The next deploy after that uploads its maps.
