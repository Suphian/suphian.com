# Physics-wordmark launch

The owner authorized replacing suphian.com with the local redesign on 2026-09-26. The original handoff was suphian-scroll-demo 8815f8e; launch preparation is saved there as 87bf955. The production repository launch branch begins at 40f1576 and includes the two prepared contact-email commits.

## Verification

- Clean npm ci: zero reported vulnerabilities in the new dependency tree.
- Final unit suite: 139 passed.
- Local production browser suite: 41 passed, 13 intentional platform-specific skips; 11 responsive sizes covered.
- No-JavaScript view: six approved work summaries and contact links readable.
- JavaScript view: original animated design, one H1, six story controls, no application errors.
- GitHub CI for the initial launch commit passed.
- Preview: https://suphian-88nob0sit-suph.vercel.app (protected).
- Preview HTTP checks: homepage, robots, sitemap, llms text, social card and email icon all return 200 with expected content types. The removed font PDF returns the site's HTML fallback, not PDF bytes.

The protected preview injects Vercel's feedback toolbar, which the production CSP blocks. Remote test runs may set E2E_IGNORE_VERCEL_TOOLBAR_CSP=1 to record and ignore only the exact toolbar-script CSP warning on vercel.app hosts. Application errors still fail tests; production checks do not use this exception.

## Production and email rollout

Merge the launch pull request after deployed browser checks and the authorized real form send pass. GitHub's Vercel integration deploys main. Then deploy notify-contact-submit to Supabase with existing JWT verification and secrets. The form saves a database row before requesting mail; a successful UI message alone is insufficient mail evidence, so verify both provider IDs.

Original production rollback target: https://suphian-mmj2nraub-suph.vercel.app (dpl_9pZWAD18kZjY6aWNJVJxpDtuR4LZ, Git commit 47c64f7). Keep this deployment available. Run vercel rollback with that URL from the linked project if needed, then revert the corresponding Git changes to align subsequent builds.

## Remaining account/file-dependent items

Google Search Console was signed in but had no accessible verified property. Bing Webmaster was signed out. Submit https://suphian.com/sitemap.xml after establishing property access. The public crawling files are already included in the launch.

The owner confirmed the font license. The supplied Semibold remains in place of Medium because no Medium file was available. The trial-license PDF and retired artwork are outside public deployment output.
