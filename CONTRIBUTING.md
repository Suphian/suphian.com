# Contributing

This is a personal site with a single maintainer, so the workflow is deliberately light.

## Deploying

`main` is production. Vercel builds and deploys every push to it automatically, and
`vercel.json` applies the redirects, cache rules, and security headers at the edge.

Every push and pull request also runs CI (`.github/workflows/ci.yml`): lint, then
typecheck, then build. Keep it green.

## Before you push

```bash
npm run lint && npm run typecheck && npm run build
npm run preview:local   # serve the production build on :8080 and click through
```

Verify against the production build, not just the dev server — the chunk splitting,
service worker, and `console` stripping only exist in a real build.

For anything risky, push a branch first. Vercel gives every branch a preview
deployment, which is also the only way to exercise the `vercel.json` headers and
redirects, since those don't apply under `vite preview`.

Rolling back is a one-click revert to the previous deployment in the Vercel dashboard,
or a `git revert` plus push.

## Notes

- Everything in `public/` ships to the CDN verbatim. Editable image masters belong in
  `assets-src/`; run `npm run optimize:images` to regenerate the derivatives.
- Unused locals, parameters, and variables are compile and lint errors. That's on
  purpose — dead code accumulated badly here once already.
