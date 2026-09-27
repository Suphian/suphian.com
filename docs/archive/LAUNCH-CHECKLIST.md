# Launch checklist: new suphian.com

Suphian authorized deployment and the remaining launch/SEO work on 2026-09-26. The source handoff is suphian-scroll-demo at 8815f8e.

- [x] Identify and preserve the approved physics-wordmark design, story index, crown card, header/footer, public email and contact changes.
- [x] Baseline unit suite: 135 passed.
- [x] Baseline production browser suite: 41 passed, 13 intentional platform-specific skips; 11 responsive sizes covered.
- [x] Remove the trial font PDF and retired artwork from public deployment assets.
- [x] Replace old social card and fallback favicon with current wordmark branding.
- [x] Prepare existing GitHub/Vercel project on a launch branch, retaining Supabase backend and migrations.
- [x] Update CI for Node 24, unit tests and production browser checks.
- [x] Finish SEO metadata, structured data and crawlable initial HTML, then verify the final build.
- [x] Verify protected Vercel preview, including one real contact send.
- [x] Merge to main, verify production domain/redirects and preserve rollback URL.
- [x] Deploy rebranded contact emails to Supabase (ACTIVE version 36, JWT verification enabled); the single real preview submission returned both email-provider IDs. Inbox arrival was not independently confirmed.
- [x] Create and auto verify the Google Search Console URL-prefix property; submit sitemap.xml. Google reports "Sitemap processed successfully", last read 9/26/26, 1 discovered page, 0 videos.

## Follow-up outside the launch build

- Owner confirmed the PP Neue Montreal license. The supplied Regular/Italic/Semibold files are retained; swap Semibold for licensed Medium when that file is available.
- Bing Webmaster requires a new Google account connection (name/profile picture/email). No new connection/account was created; complete account access and submit sitemap.xml when ready.
- LinkedIn headline changes remain the owner's editorial choice.

See docs/seo-plan.md for current search guidance and limits, and docs/launch.md for deployment evidence.
