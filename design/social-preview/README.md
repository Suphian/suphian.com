# Suphian social preview studio

Public gallery: [suphian-preview-studio.vercel.app](https://suphian-preview-studio.vercel.app/).

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

## Publish the gallery

The separate Vercel project is `suph/suphian-preview-studio`. Deploy the built static files from an isolated staging directory so the main site's project link remains untouched. From the repository root in PowerShell:

```powershell
npx.cmd vite build design/social-preview --config design/social-preview/vite.config.mjs
if ($LASTEXITCODE -ne 0) { throw 'Gallery build failed' }
$galleryStage = Join-Path $env:TEMP ('suphian-preview-studio-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $galleryStage | Out-Null
Copy-Item -LiteralPath 'design/social-preview/dist/index.html', 'design/social-preview/dist/assets', 'design/social-preview/vercel.json' -Destination $galleryStage -Recurse
vercel.cmd link --yes --scope suph --project suphian-preview-studio --cwd $galleryStage
if ($LASTEXITCODE -ne 0) { throw 'Gallery project linking failed' }
vercel.cmd deploy --prod --yes --scope suph --cwd $galleryStage
```

The stable public address is `https://suphian-preview-studio.vercel.app/`. The gallery's canonical and sharing metadata use that address; its sharing image is the approved Editorial asset on `suphian.com`. The static Vercel configuration adds `X-Robots-Tag: noindex, nofollow` and does not change deployment protection settings.
