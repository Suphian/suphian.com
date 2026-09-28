# Suphian social preview studio

All three approved designs are preserved here as 1200 × 630 PNGs:

- [Signature](assets/signature.png): the full red wordmark on a softly lit dark canvas.
- [Editorial](assets/editorial.png): the homepage statement, full wordmark, and personal identity.
- [Contrast](assets/contrast.png): the full red wordmark on a clean white canvas.

**Editorial was selected for production on September 27, 2026.** It is the gallery's default and is marked “Your pick.” All directions remain available for download and future use. `assets/current.png` archives the previous square preview and is labeled “Previous” in the gallery.

## Run or build

Run these commands from the repository root after `npm install`:

```sh
npx vite design/social-preview --config design/social-preview/vite.config.mjs
npx vite build design/social-preview --config design/social-preview/vite.config.mjs
```

In Windows PowerShell, use `npm.cmd` and `npx.cmd` if script execution is restricted.

The local studio is at `http://127.0.0.1:4180`. Build output is in `design/social-preview/dist/`; that self-contained directory can be deployed as a separate static Vercel project. The gallery is independent of the main site's production build and includes `noindex, nofollow` metadata. Fonts are reused from `public/fonts/` and bundled into the gallery build.

Direction links support `?direction=signature`, `?direction=editorial`, or `?direction=contrast`. The iMessage and WhatsApp examples are layout mockups, not native-app captures or guarantees of platform rendering.

## Regenerate the artwork

```sh
npx playwright install chromium
node scripts/render-preview-directions.mjs
```

The renderer uses the shared SVG wordmark from `src/wordmark/lettering.js` and the existing PP Neue Montreal font files. It renders at twice the final resolution, then creates full RGB PNGs at 1200 × 630. The editable compositions live in `scripts/render-preview-directions.mjs`.

Regeneration writes the three PNGs and standalone HTML inspection exports to `assets/`. The HTML exports, build output, and QA screenshots are ignored. The archived previous preview is never regenerated.
