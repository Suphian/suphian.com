# Favicon wiring (for the lead to apply)

Nothing outside `src/favicon/`, `public/favicon-suph.svg` and `public/icons/` was edited. Three edits wire it in, plus an optional fourth for the tests.

## Variants and the ambient beat (no wiring needed)

- **Four motions**, in `frame-math.js`. `DEFAULT_VARIANT` picks the site's (`'hop'`). To switch, change that one name, or pass `initFavicon({ variant: 'jelly' })`. Unknown names fall back to the default.
  - `wave`: the original S→H squash-and-stretch ripple.
  - `hop`: the word crouches, hops about 2 px, lands with a squash and a small rebound.
  - `jelly`: the word rocks side to side about its middle, sinking a little on each swing, and settles.
  - `puff`: the word inflates like a balloon in two breaths, lets the air out past rest, and wobbles back.
- Every variant lasts the same 1.16 s and starts and ends on the same rest frame, so the static icons in `public/` are unchanged. Each has a Firefox 8 fps twin (`GECKO_MOTIONS`).
- **Ambient beat.** While the tab is visible, another burst plays about every 15 s: `ambientEvery: 15000`, give or take `ambientJitter: 3000`, at `strengths.ambient: 0.7`. The count runs from the end of the last burst, and the beat starts after the first burst. Hiding the tab clears the timer, and any other burst restarts the count. It never runs before load or under reduced motion. `initFavicon({ ambientEvery: null })` turns it off.
- **Letters are clipped to the tile** (canvas `source-atop`), so a squash, lean or lift can never leave red specks outside the rounded corners on the tab strip.
- Pick by eye: `qa/favicon-variants-sheet.png` has all four stacked; `qa/favicon-variant-<name>.png` has one each, with Firefox's frames.

## 1. `index.html` head

Replace the current icon lines:

```html
<link rel="icon" href="/assets/images/favicon-256.png" type="image/png" />
<link rel="shortcut icon" href="/assets/images/favicon-256.png" type="image/png" />
<link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png" />
```

with:

```html
<link rel="icon" href="/icons/favicon-32.png" sizes="32x32" type="image/png" />
<link rel="icon" href="/favicon-suph.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

- Put the PNG first. Its `sizes="32x32"` makes Chromium and Firefox prefer the SVG, which has no `sizes`. Safari before 26 and older browsers use the PNG.
- Leave `<link rel="manifest">` and `theme-color` (#080808) as they are. The tile colour is the same #080808.
- Don't add an id to either link. At the first burst, `initFavicon()` creates its own `<link rel="icon" id="favicon-dynamic">` and parks these two (`rel` becomes `x-suph-parked-icon`). Teardown restores them. Without JS, or with reduced motion, the static SVG/PNG stay in charge.
- `public/favicon.ico` is still the old icon. Browsers only fetch it when a page has no icon links, but it can be regenerated later from `public/icons/favicon-32.png`.

## 2. `src/main.jsx`

Add the import next to the others, and add the call right after `createRoot(rootElement).render(<App />);` inside the `try`:

```js
import { initFavicon } from './favicon/favicon.js';
```

```js
  initFavicon();
```

Import `./favicon/favicon.js` by its full path. There is no `src/favicon/index.js`, so a directory import (`'./favicon'`) will not resolve.

It is framework-free, idempotent (safe with StrictMode and HMR) and returns a teardown. Optional manual trigger elsewhere: `import { jiggle } from './favicon/favicon.js'; jiggle(0.6);`. It returns false before the page has loaded, while hidden, or under reduced motion.

Calling it right after `render()` is fine, even though React hasn't committed yet:

- **Nothing happens before the page has loaded.** If `document.readyState` isn't `"complete"`, it waits for window `pageshow`, which follows `load`. The first-load burst runs 450 ms after that, and dock transitions or `jiggle()` calls before it do nothing. Chromium ignores favicon changes until the load event finishes, and Firefox saves any icon set before `pageshow` as the page's favicon in bookmarks and history, so a mid-jiggle frame could end up there.
- **It reads `<html data-docked>`**, which Wordmark already sets, through a MutationObserver. No wordmark edits are needed. The first value Wordmark writes is taken as a baseline, not a landing. On /podcast, the 404 page or any deep link, SUPH renders already docked (null → `"true"`), and that doesn't jiggle. Only a later `"false"` → `"true"` counts as docking.

## 3. `public/site.webmanifest` `icons`

Replace the `icons` array. The old entries use `"any maskable"` together, which is discouraged because a maskable crop of an "any" icon clips it.

```json
"icons": [
  { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]
```

and in `shortcuts[0].icons`:

```json
{ "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" }
```

## 4. `package.json` `test` script (optional, recommended)

`package.json`'s `test` script now includes `"src/favicon/*.test.mjs"`, so `npm test` runs the 41 favicon tests. The minimal form is:

```json
"test": "node --test tests/ \"src/favicon/*.test.mjs\""
```

Node 21+ expands the quoted glob itself, so it works the same from cmd.exe, PowerShell and bash. To run only the favicon tests: `node --test "src/favicon/*.test.mjs"`. The old `node --test src/favicon/` no longer works because the index.js loader was removed.

## Notes

- **Firefox.** Firefox batches `<link rel=icon>` changes and loads at most about one every 100 ms, plus an idle wait. At 30 fps it would drop about two frames in three, and unevenly. On Gecko (a `Gecko/<version>` user agent, so not Chrome, Safari or Firefox on iOS), the same motion is therefore sampled at 8 fps: 10 frames over the same 1.16 s, each 125 ms or more apart and placed near the motion's extremes. Each variant has its own offset, and hop's air time is set so its crouch, top and landing all fall on that grid. The Firefox rows of `qa/favicon-variant-<name>.png` show what Firefox gets. Frames can still merge if the main thread stays busy through Firefox's idle wait.
- There is no CSP today. If one is added, `img-src` must allow `data:`, or the animated frames won't show.
- The static icons (`favicon-suph.svg`, `icons/*.png`) were regenerated with SUPH vertically centred. The favicon's baseline is on row 12 of 16, and the large icons' ink centre is at 49%. They match the canvas rest frame.
- Regenerate the static icons: `node src/favicon/build-icons.mjs` (only needed if the rest frame ever changes; no variant changes it). QA renders: `node src/favicon/qa-favicon.mjs` writes `qa/favicon-options.png`, `favicon-variant-{wave,hop,jelly,puff}.png`, `favicon-variants-sheet.png` and `favicon-zoom.png` (the default variant). `node src/favicon/qa-favicon.mjs hop jelly` renders just those two strips and a sheet of them. Tests: `node --test "src/favicon/*.test.mjs"`.
