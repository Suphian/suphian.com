# Design brief: Suphian's personal site

Source: Suphian's art-direction brief (2026-09-26), with his overrides applied. **Where this file and older notes disagree, this file wins.**

## Role
Art director and front-end designer: the visual identity and its execution.

## Copy
~~Keep all copy verbatim~~ **Override (Suphian): copy can change when needed.** Keep it truthful: no invented facts. Log copy changes in `COPY-CHANGES.md`.

## Brand personality
Confident, curious, entrepreneurial, warm, playful. Beautiful design, moving quickly, making things real. Good taste without arrogance. Personal and distinctive, not a corporate portfolio or a generic AI startup.

## Logo
- Use the original approved red-on-black, tightly squished SUPHIAN/SUPH bubble artwork (`src/wordmark/lettering.js`, `public/logos/*.svg`), not later redesigned variations. Keep its letterforms, compressed proportions and soft, inflated character.
- Use the supplied assets. Never recreate them with a bubble font.
- The logo supplies the personality; the interface gives it room.
- Bubble lettering is reserved for the logo and approved graphic assets (e.g. his SAY HELLO art). Never use it for ordinary interface text.
- Legacy logo assets from the old site (e.g. `suph-logo-animation.mp4` on the 404, `assets/logos/logo-292.webp`) are **not** the approved artwork and must be replaced or retired.

## Supporting typography
- **PP Neue Montreal**: Regular for body copy; Medium for headings, navigation and buttons. Use real, appropriately licensed font files.
  - **Status:** Suphian is supplying the files. Expected at `public/fonts/PPNeueMontreal-Regular.woff2` and `public/fonts/PPNeueMontreal-Medium.woff2` (.woff and .otf also accepted).
  - Until they arrive, the type is not restyled. Fallback only if he approves it: General Sans.
- Crisp, readable, spacious. Body starts around **18px** with comfortable line height.
- **Avoid:** tiny labels, excessive uppercase styling and unnecessary weights. Use two weights only (Regular 400, Medium 500).

## Color and composition
- Red, near-black and white. **No cream.** The red matches the approved artwork (`#fb2726` → `#fa2322`, from `LETTERING_DEFS`).
- Generous negative space, clear hierarchy, strong alignment, restrained supporting elements.
- **Avoid:** decorative clutter, heavy glow, chrome effects and competing visual themes.

## Motion
- The hero opens with oversized SUPHIAN filling the first screen. Scrolling compresses it into the compact SUPH mark at the top right. The approved artwork is preserved exactly at both endpoints.
- The motion is fluid, reversible and tied to natural scrolling. No scroll hijacking and no duplicate logos (e.g. at the bottom left).
- Support reduced motion and small screens.
- **Override (Suphian): keep the bouncing.** The SUPH dock layers (landing bounce, scroll jiggle, hover/press squish, idle breathing) stay.

## No dead pages (Suphian, 2026-09-26)
- No 404 or dead-end pages. Unknown URLs and removed pages (e.g. `/podcast`) redirect to home: `src/main.jsx` puts any other path back to `/` before the first render (no router since 2026-09-27; Vercel serves them `dist/404.html` with a real 404 status).
- For production, `vercel.json` needs a permanent (301) redirect `/podcast` → `/` for old links, plus the SPA rewrite.
- `src/pages/NotFound.jsx` and the `notFound` copy are now unused. Delete them in the final cleanup.

## Execution
- Work within the existing stack. Preserve routes, links and functionality.
- **No browser automation for previews (Suphian's choice).** He reviews at http://127.0.0.1:4173 himself. Verify with builds, tests and code checks.
- **Never deploy to production without Suphian's explicit approval.**
