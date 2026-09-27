# suphian.com

The source for [suphian.com](https://suphian.com), Suphian Tweel's personal site: a red SUPHIAN wordmark that compresses into SUPH as you scroll, a six-chapter work index (four jobs, two side projects), a SAY HELLO sign-off and a contact form.

- **App:** Vite 7 and React 18 in plain JavaScript (JSX, no TypeScript). One route, `/`.
- **Hosting:** Vercel project `suph/suphian.com`, connected to [Suphian/suphian.com](https://github.com/Suphian/suphian.com). `main` is production.
- **Contact form:** the browser calls Supabase directly (a rate-limit RPC, then an insert into `contact_submissions`, using the public anon key under row-level security), then the `notify-contact-submit` edge function sends two emails through Resend.
- **Analytics:** GA4 and PostHog, on the production domain only.

## Run it locally

Use Node 24 and npm. On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`.

```sh
npm ci
npm run dev       # http://127.0.0.1:4173
npm run build     # writes dist/
npm run preview   # serves dist/ at http://127.0.0.1:4173 with vercel.json's headers and CSP
```

`dev` and `preview` both bind 127.0.0.1:4173 with `strictPort`, so stop one before starting the other. A busy port is an error; Vite will not move to another port.

### Contact form: dry run or live

- **`npm run dev` is a dry run by default.** A fixed "Local · dry-run" pill shows (`src/components/DryRunBadge.jsx`), and submitting logs the three calls it would make to the browser console under `[dry-run]`. No network requests are made.
- **To send for real from dev,** set `VITE_LIVE_BACKEND=true` in `.env.local` (see `.env.example`) and restart the dev server. The switch is `LIVE` in `src/lib/backend.js`.
- **Every production build is live,** including `npm run preview`. A submission there writes a real row and sends real emails. For a deliberate real test, follow [CONTRIBUTING.md](CONTRIBUTING.md): use the owner's address and a clearly labeled message.

### Dev-only tools

- **`?tune`:** open http://127.0.0.1:4173/?tune to get the wordmark motion panel (`src/wordmark/TuningPanel.jsx`). Sliders change `MOTION` live; "Copy config" copies a literal to paste into `src/wordmark/motion.js`. It is never included in production builds.
- **`analytics-debug`:** see [Analytics](#analytics).

## Tests

```sh
npm test                          # unit tests (node --test), no browser
npx playwright install chromium   # once, before the browser suites
npm run e2e                       # against the dev server, which must already be running on :4173
npm run e2e:prod                  # builds, serves dist/ on :4174, tests that (what CI runs)
npm run e2e:hmr                   # dev-server hot-reload regression; run it on its own
```

**`npm test`** runs `tests/` plus the `*.test.mjs` files in `src/favicon`, `src/sayhello`, `src/components`, `src/story` and `src/lib`. The script names those folders, so add a new folder there if you put a test file elsewhere. The tests cover:

- wordmark physics, lettering and hover effects
- favicon frames and SAY HELLO motion
- story content, rendering and style rules (type tokens, no labels under 16px, no uppercase)
- the generated SEO output: initial HTML, JSON-LD, and the public/ crawler files matching `src/content.js`
- both contact emails
- analytics wiring: the `/ingest` proxy, the CSP and the service worker

**Browser suites** (`e2e/`, Playwright, headless Chromium) run `smoke.spec.js` and `responsive.spec.js` on a desktop (1440×900) and a mobile (Pixel 7) project. The 11-viewport responsive matrix runs once. `e2e/guard.js` fails any test that logs a console error, throws, or shows the error screen. It also stubs every Supabase request, so no suite ever writes a row or sends an email, even against a production build.

- **`e2e:prod`** is hard-wired to port 4174 (`e2e/config.js`) and starts its own `vite preview`, so it can run while the dev server holds 4173. Port 4174 must be free.
- **`E2E_BASE_URL`** points the suites at a deployed site instead; only its origin is used. For a protected preview, also set `E2E_STORAGE_STATE` to a Playwright storage-state file (keep it in `qa/`, never commit it). On `*.vercel.app`, `E2E_IGNORE_VERCEL_TOOLBAR_CSP=1` ignores only the preview toolbar's CSP warning. `e2e:hmr` ignores `E2E_BASE_URL`.

  ```sh
  E2E_BASE_URL=https://<deployment>.vercel.app npm run e2e             # bash
  $env:E2E_BASE_URL = 'https://<deployment>.vercel.app'; npm run e2e   # PowerShell
  ```

- **`e2e:hmr`** needs the dev server running. It edits `src/components/UIProvider.jsx` and restores it.
- **Output:** results go to `qa/e2e-results/` (traces and screenshots on failure) and matrix screenshots to `qa/responsive/`. `qa/` is gitignored.

**CI** (`.github/workflows/ci.yml`) runs on pull requests and pushes to `main` with Node 24: `npm ci`, `npm test`, Chromium install, `npm run e2e:prod`.

## Where things live

| Path | What it is |
|---|---|
| `src/content.js` | Every user-facing string, plus the SEO metadata and JSON-LD source. Edit copy here, not in components or `index.html`. |
| `index.html` | The page template and the GA4 snippet. `<!-- seo:head -->` and `<!-- seo:profile -->` are filled from `content.js` at dev and build time, which gives no-JavaScript visitors and crawlers a readable profile. |
| `scripts/seo.mjs` | Renders the head tags, JSON-LD, static profile and crawler files (`robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, `humans.txt`). `vite.config.js` calls it; the build writes the crawler files into `dist/`. |
| `scripts/sync-seo.mjs` | Writes the same crawler files into `public/` and syncs the name and description in `public/site.webmanifest`. |
| `src/wordmark/` | The physics wordmark: `lettering.js` (the approved traced artwork), `physics.js`, `geometry.js`, `motion.js` (every tuning constant), `dockfx.js` (pointer hover and press effects on the docked SUPH and the hero), `TuningPanel.jsx` (`?tune`). |
| `src/story/` | The work index and chapter dialogs. Copy comes from `story` in `content.js`. |
| `src/sayhello/` | The SAY HELLO sign-off art and its motion. `src/components/SayHello.jsx` renders it and opens the contact sheet. |
| `src/components/` | Header, footer, contact sheet and form, toasts, UI context, `DryRunBadge`. |
| `src/lib/` | `backend.js` (Supabase client, `LIVE` switch), `contactSubmit.js`, `analytics.js`, `webVitals.js`, `serviceWorker.js`, validation, sanitizing and rate limiting. |
| `src/favicon/` | The animated SUPH favicon. `WIRING.md` describes its variants and timing (its wiring steps are already applied). |
| `public/` | Ships to the CDN as-is: fonts, icons, logos, the social card, work logos, `sw.js`, crawler files. Keep license documents, originals and credentials out. |
| `assets-src/` | Design masters, retired artwork and the font license PDF. Committed, but `.vercelignore` keeps it out of deployments. |
| `supabase/functions/notify-contact-submit/` | `index.ts` is the Deno handler (Resend, per-IP limit). `emails.ts` holds both emails, HTML and plain text, written so Node can load it too. |
| `supabase/migrations/` | Database history, including `contact_submissions` and `check_rate_limit`. |

### Regenerating files

| Command | Writes |
|---|---|
| `node scripts/sync-seo.mjs` | `public/` crawler files and manifest text. Run it after editing `src/content.js`; `npm test` fails until `public/` matches. |
| `npm run logos` | `public/logos/*.svg` from `src/wordmark/lettering.js` |
| `node src/favicon/build-icons.mjs` | `public/favicon-suph.svg` and `public/icons/*.png` (no browser needed) |
| `node src/favicon/qa-favicon.mjs` | Favicon QA sheets in `qa/` |
| `node scripts/trace-say-hello.mjs` | `public/contact/say-hello.svg` from `src/sayhello/lettering.js` |
| `node scripts/export-social-card.mjs` | `public/og/suphian-card.png` (the social card; path from `seo.og.image`) and `public/favicon.ico` (needs Playwright Chromium) |
| `node scripts/preview-contact-emails.mjs [out-dir] [--no-png]` | Both emails as HTML, text and (unless `--no-png`) phone and desktop PNGs, in `<tmp>/suphian-email-preview` by default. Sends nothing. |

On Windows with `core.autocrlf`, a regenerated file can show as modified when only its line endings changed. If `git diff` is empty, `git checkout -- public` clears it.

## Deploying

**Site.** Vercel builds every pushed branch as a preview behind Vercel Authentication, and builds `main` as production for suphian.com. Never merge to `main` without Suphian's explicit approval.

`vercel.json` holds the host redirects (suph.ai, www.suph.ai and www.suphian.com to suphian.com; `/podcast` to `/`), the security headers and CSP, cache rules, and the `/ingest` rewrites. There is no catch-all rewrite. The build copies `index.html` to `dist/404.html` (`vite.config.js`), so Vercel answers unknown paths with a real 404 and the full page, and the app then sends visitors home. `vite preview` answers 200 for unknown paths, so check 404s on a deployment. A new third-party host needs a CSP change in `vercel.json`; `e2e:prod` runs under the same CSP.

**Contact function.** Deploys separately; Vercel never touches it.

```sh
npx supabase functions deploy notify-contact-submit --project-ref ujughujunixnwlmtdsxd --use-api
```

Keep JWT verification on (the default; see `supabase/config.toml`) and keep the existing secrets, including `RESEND_API_KEY`. The emails load their logo from https://suphian.com/icons/apple-touch-icon.png, so ship a changed icon to the site before deploying the function. CONTRIBUTING.md covers how to verify a real send.

**Rollback.** Use Vercel's Instant Rollback: in the dashboard, open the project's Deployments, pick the last good production deployment and choose Instant Rollback. From a directory linked to `suph/suphian.com`, `vercel rollback <deployment-url>` does the same. Look up the target when you need it rather than reusing IDs from old notes. Then revert the bad commit on `main` so the next production build doesn't bring it back. To roll the function back, redeploy it from the earlier commit.

## Analytics

Both tools run only on suphian.com production builds; local builds and previews send nothing.

- **GA4:** measurement ID `G-8S5FL37K8X`, in the inline script in `index.html`. It loads after the first interaction or 3 seconds after load. `src/lib/webVitals.js` sends Core Web Vitals to it.
- **PostHog:** `POSTHOG_KEY` in `src/lib/analytics.js` is the project key for the Suph.ai org (project 631302, US cloud). It is public by design. PostHog gets custom events only: no autocapture, session replay or surveys. An empty key turns PostHog off, along with the GA4 copies of the custom events.
- **`/ingest` proxy:** `vercel.json` rewrites `/ingest/*` to PostHog's US hosts, so events stay first-party and the CSP needs no PostHog host. The proxy exists only on Vercel; locally `/ingest` returns 404. To move to the EU cloud, change `POSTHOG_REGION` and the three rewrites together; `npm test` checks that they agree.
- **Events:** the list and properties are in [docs/launch.md](docs/launch.md#analytics). Send new ones with `track()` or `trackOnce()` from `src/lib/analytics.js`, and add them to that list. `contact_submitted` carries the outcome only, never what the visitor typed; a test enforces this.
- **Debugging:** in the browser console, run `localStorage.setItem('analytics-debug', '1')` and reload. Analytics then runs on any host (the key is still required) and PostHog logs each event to the console. `localStorage.removeItem('analytics-debug')` turns it off. PostHog drops automated browsers, so Playwright runs never reach it.

## Editing copy and design

- **Brand:** [DESIGN-BRIEF.md](DESIGN-BRIEF.md) is the source of truth and wins over older notes. Only the SUPHIAN/SUPH wordmark and the SAY HELLO art are bubbly; everything else is refined ("highbrow, not bubbly"). Type is PP Neue Montreal with body text around 18px and no tiny or uppercase labels. Colors are red, near-black and white. The bouncy SUPH dock stays.
- **Fonts:** `public/fonts/` has Regular, Italic and Semibold. Semibold stands in for Medium until a licensed Medium file is supplied. The license PDF stays in `assets-src/font-license/`.
- **Copy:** edit `src/content.js` (its header comment lists the conventions) and keep every fact true. Log each change in [COPY-CHANGES.md](COPY-CHANGES.md), newest first. Then run `node scripts/sync-seo.mjs`. If homepage copy or metadata changed, set `seo.lastModified` to the deploy date, since it feeds the sitemap and the JSON-LD. Finish with `npm test`.
- **Review:** Suphian reviews changes himself at http://127.0.0.1:4173. Verify with builds and tests, not browser automation.

## More docs

- [CONTRIBUTING.md](CONTRIBUTING.md): checks before pushing, previews, rollback, the function deploy, and what never goes in `public/`.
- [DESIGN-BRIEF.md](DESIGN-BRIEF.md) and [COPY-CHANGES.md](COPY-CHANGES.md): brand rules and the copy log.
- [docs/launch.md](docs/launch.md): the launch record, verification and analytics events.
- [docs/seo-plan.md](docs/seo-plan.md): search and AI discoverability, the production audit and owner follow-ups.
- [docs/archive/](docs/archive/): the completed launch checklist.
