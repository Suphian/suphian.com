"""Trace only the seven large red characters in the supplied concept image.

Optional authoring tool, not a runtime dependency. Install numpy, Pillow,
opencv-python-headless and potracer, then run with the reference PNG path.
The generated SVGs contain editable Bezier paths, never the source bitmap.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
import potrace
from PIL import Image

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1])
rgb = np.array(Image.open(source).convert('RGB'))
mask = ((rgb[:, :, 0] > 110)
        & (rgb[:, :, 0] > rgb[:, :, 1] * 1.8)
        & (rgb[:, :, 0] > rgb[:, :, 2] * 1.8)).astype(np.uint8)
mask[:140] = 0
mask[760:] = 0
_, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
components = [i for i, stat in enumerate(stats) if i and stat[4] > 1000]
components.sort(key=lambda i: stats[i][0])
# Horizontal ordering is S, U, P, H, i-dot, i-stem, A, N.
groups = [[components[0]], [components[1]], [components[2]],
          [components[3]], components[4:6], [components[6]], [components[7]]]


def point(p):
    return f'{p.x - 2:.2f},{p.y:.2f}'


glyphs = []
for char, indices in zip('SUPHIAN', groups):
    x = min(int(stats[i][0]) for i in indices)
    right = max(int(stats[i][0] + stats[i][2]) for i in indices)
    letter_mask = np.isin(labels[150:742, x - 2:right + 2], indices)
    curves = potrace.Bitmap(~letter_mask).trace(
        turdsize=3, alphamax=1, opticurve=True, opttolerance=0.3)
    subpaths = []
    for curve in curves:
        commands = [f'M {point(curve.start_point)}']
        for segment in curve:
            if segment.is_corner:
                commands.append(f'L {point(segment.c)} {point(segment.end_point)}')
            else:
                commands.append(f'C {point(segment.c1)} {point(segment.c2)} {point(segment.end_point)}')
        commands.append('Z')
        subpaths.append(' '.join(commands))
    glyphs.append(dict(id=char.lower(), char=char, width=right-x,
                       x=x-7, compactX=x-7 if len(glyphs)<4 else None,
                       path=' '.join(subpaths)))

data = json.dumps(glyphs, indent=2)
module = '''/**
 * SUPHIAN — editable cubic silhouettes traced from the supplied raster concept.
 * Every character is an independent group; the dotted I has two closed contours.
 * Reference crop: x=7..1668, y=150..742. UI and copyright mark are excluded.
 * Raster tracing approximates the source edge and procedural grain approximates
 * its surface texture. No font outlines or raster images are embedded.
 */
export const FULL_VIEWBOX = { width: 1661, height: 592 };
export const COMPACT_VIEWBOX = { width: 1044, height: 592 };

export const LETTERING_DEFS = `
  <linearGradient id="letter-red" x1="0" y1="0" x2="0" y2="592" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#fb2726"/>
    <stop offset=".56" stop-color="#fb2423"/>
    <stop offset="1" stop-color="#fa2322"/>
  </linearGradient>
  <filter id="letter-surface" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="3" seed="17" stitchTiles="stitch" result="noise"/>
    <feColorMatrix in="noise" type="saturate" values="0" result="mono-noise"/>
    <feComponentTransfer in="mono-noise" result="soft-noise"><feFuncA type="linear" slope=".16"/></feComponentTransfer>
    <feComposite in="soft-noise" in2="SourceAlpha" operator="in" result="clipped-noise"/>
    <feBlend in="SourceGraphic" in2="clipped-noise" mode="soft-light"/>
  </filter>
`;

const tracedGlyphs = __DATA__;

export const LETTERS = tracedGlyphs.map(glyph => ({
  ...glyph,
  markup: `<path class="letter-silhouette" d="${glyph.path}" fill="url(#letter-red)" fill-rule="evenodd" filter="url(#letter-surface)"/>`,
}));

/** Produce independent editable SVG assets from the demo's traced geometry. */
export function createLogoSvg({ compact = false, idPrefix = '' } = {}) {
  const letters = compact ? LETTERS.slice(0, 4) : LETTERS;
  const viewBox = compact ? COMPACT_VIEWBOX : FULL_VIEWBOX;
  const name = compact ? 'SUPH' : 'SUPHIAN';
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBox.width} ${viewBox.height}" role="img" aria-labelledby="logo-title logo-description">
  <title id="logo-title">${name} — inflated red lettering</title>
  <desc id="logo-description">Editable cubic paths traced from the provided Suphian concept image. Each character is a separate named group, including the two-part dotted I. Raster contour fitting and procedural surface grain are approximations. Transparent background.</desc>
  <metadata>Source-derived vector tracing; no fonts or embedded raster images.</metadata>
  <defs>${LETTERING_DEFS}</defs>
  ${letters.map(letter => `<g id="letter-${letter.id}" data-letter="${letter.char}" transform="translate(${letter.x} 0)">${letter.markup}</g>`).join('\\n  ')}
</svg>\\n`;
  if (idPrefix) {
    svg = svg.replace(/id="([^"]+)"/g, (_, id) => `id="${idPrefix}${id}"`)
      .replace(/url\\(#([^)]+)\\)/g, (_, id) => `url(#${idPrefix}${id})`)
      .replace('aria-labelledby="logo-title logo-description"', `aria-labelledby="${idPrefix}logo-title ${idPrefix}logo-description"`);
  }
  return svg;
}
'''.replace('__DATA__', data)
(root/'src'/'lettering.js').write_text(module, encoding='utf-8')
for glyph in glyphs:
    print(glyph['char'], 'x=', glyph['x'], 'width=', glyph['width'],
          'curves=', glyph['path'].count('C'), 'contours=', glyph['path'].count('M'))
