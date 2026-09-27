# Suphian Tweel

The source for [suphian.com](https://suphian.com): a Vite + React personal site with a red SUPHIAN wordmark that compresses into SUPH on scroll, a six-chapter work index, and a contact form backed by Supabase.

## Local development

Use Node 24 and npm. On Windows, use npm.cmd if PowerShell blocks npm.ps1.

```sh
npm ci
npm run dev
npm test
npm run e2e:prod
```

Development runs at http://127.0.0.1:4173. Production browser tests build the site, serve it at :4174 with the production security headers, and exercise desktop/mobile interactions plus an 11-size responsive matrix. Automated tests stub contact requests. Development contact submissions are dry runs unless VITE_LIVE_BACKEND=true; production builds use the real backend.

## Structure

- src/content.js: approved copy and metadata source.
- src/wordmark/: vector lettering and scroll physics.
- src/story/: work index and chapter dialogs.
- src/components/: contact sheet, SAY HELLO, header, and footer.
- public/: only files intended for public download.
- assets-src/: design masters and archived assets, excluded from deployment.
- supabase/functions/notify-contact-submit/: notification and thank-you emails.
- docs/: launch and SEO notes.

## Deployment

The GitHub repository is connected to Vercel project suph/suphian.com. Branches create protected previews; merging to main deploys production. CI runs the unit and production browser suites. See [CONTRIBUTING.md](CONTRIBUTING.md) for verification and rollback commands.

Regenerate the wordmark assets with npm run logos, and the social preview image/favicon with node scripts/export-social-card.mjs (requires Playwright Chromium installed).

The font license was confirmed by the owner. The provided Regular/Italic/Semibold files are used; the optional Medium file was not present in the handoff. The license PDF is kept outside public/.
