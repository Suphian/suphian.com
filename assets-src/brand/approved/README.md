# Approved SUPH logo variants

Suphian approved these on 2026-09-27 ("all good PNGs of approved different variants of the logo"). They are the compact SUPH mark, 2172 × 724, RGBA PNG. They are kept here as source art: nothing in `public/` or `src/` loads them, so they never ship to visitors.

| File | Variant | Use it for |
|---|---|---|
| `suph-black.png` | Black lettering | Light backgrounds, print, documents |
| `suph-red.png` | Red lettering with the grain texture | Dark backgrounds; the site's own look |
| `suph-white.png` | White lettering | Dark or photographic backgrounds |

The site itself draws the lettering from the traced vectors in `src/wordmark/lettering.js` (exported as `public/logos/*.svg` by `npm run logos`), not from these PNGs. For a new asset at another size, prefer those SVGs, and use these PNGs as the approved reference for colour and texture.
