Story index cards: one image per chapter, set on the company color
(src/content.js story.chapters[].color). suph.app has one per monthly build
(story.chapters[].builds[].image), and its card shows the newest.

  steadily.svg   youtube.svg   google.svg   huge.svg   abacus-white.png
  suph-app.svg (The Toga Is Dead's crown)   quran-art.svg (placeholder star until Suphian supplies artwork)

Logo cards (every card, suph.app's builds included): a white logo, centred on both axes.
- White marks on a transparent background. SVGs need a viewBox tight to the ink,
  with plain <path>/<rect> glyphs (no transforms).
- A wordmark with a descending "g" also gets a small optical nudge
  (story.chapters[].image.nudge). It is measured from the SVG's own paths by
  src/story/logo-geometry.js; after swapping a logo, run
  `node --test src/story/` and copy the measured value into content.js.
- abacus-black.png is the dark version of the Abacus mark (not used on the cards).

A missing or broken file never shows as broken: the card sets the chapter's name
in type instead.
