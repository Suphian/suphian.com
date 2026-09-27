"""Trace the SAY HELLO sign-off the same way SUPHIAN was traced.

Adapted from scripts/trace-reference.py (same stack: NumPy, Pillow, OpenCV,
potracer; same potrace settings; same glyph table shape). Optional authoring
tool, not a runtime dependency:

    pip install --user numpy pillow opencv-python-headless potracer
    python scripts/trace-say-hello.py [assets-src/say-hello-original.png] [--proof]

What differs from the SUPHIAN trace, and why:
- Isolation. The SAY HELLO art is RGBA: its solid letter bodies are opaque,
  while the outer glow, blurry fringe and dark inner rim are all
  semi-transparent. So the letter mask is alpha > 128 (the threshold sits inside
  the glow), which keeps only the solid red bodies, their counters (A, O) and
  every notch. Each letter is one 8-connected component, ordered left to right.
- Units. The glyphs are written in the wordmark's units: coordinates are scaled
  so the median SAY HELLO cap height equals the median SUPHIAN cap height
  (566.67 units). Scaling happens before tracing (the alpha is resampled with a
  cubic filter and re-thresholded), so potrace fits curves at the target
  resolution. Because both words share units, the wordmark's userSpaceOnUse
  gradient (0..592) and its feTurbulence grain (0.72 cycles per unit) come out
  at the same size on both words when they are shown at the same cap height.
- Checks. Every traced letter is rasterized back onto the source pixel grid and
  compared with its solid-body mask (per-letter IoU, printed).

Writes src/sayhello/lettering.js (then run scripts/trace-say-hello.mjs to export
public/contact/say-hello.svg). With --proof it also renders
qa/say-hello-vs-wordmark.png and qa/say-hello-compare.png through one renderer
(evenodd fill, the wordmark gradient, the SVG feTurbulence reference algorithm,
soft-light blend) so the two words can be compared without a browser.
"""
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
import potrace
from PIL import Image

root = Path(__file__).resolve().parent.parent
args = [a for a in sys.argv[1:] if not a.startswith('--')]
PROOF = '--proof' in sys.argv
source = Path(args[0]) if args else root / 'assets-src' / 'say-hello-original.png'

CHARS = 'SAYHELLO'
IDS = ['s', 'a', 'y', 'h', 'e', 'l1', 'l2', 'o']
SUPHIAN_CAP = 566.67    # Median SUPHIAN letter height in wordmark units (src/wordmark/lettering.js).
BASELINE = 583.0        # Where SUPHIAN's letters typically sit in its 592-unit viewBox.
VIEW_HEIGHT = 592       # Same height as the wordmark's FULL_VIEWBOX.
SIDE = 4.0              # Units of air left and right, like SUPHIAN's S at x=4.
ALPHA_CUT = 128         # Solid body threshold, inside the glow.

rgba = np.array(Image.open(source).convert('RGBA'))
alpha = rgba[:, :, 3]
mask = (alpha > ALPHA_CUT).astype(np.uint8)
_, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
components = [i for i, stat in enumerate(stats) if i and stat[4] > 1000]
components.sort(key=lambda i: stats[i][0])
assert len(components) == len(CHARS), f'expected 8 letters, found {len(components)}'

heights = sorted(int(stats[i][3]) for i in components)
k = SUPHIAN_CAP / ((heights[3] + heights[4]) / 2)   # source px -> units
bottoms = sorted(int(stats[i][1] + stats[i][3]) for i in components)
Y0 = (bottoms[3] + bottoms[4]) / 2 - BASELINE / k   # source px at viewBox y=0
X0 = min(int(stats[i][0]) for i in components) - SIDE / k
X1 = max(int(stats[i][0] + stats[i][2]) for i in components) + SIDE / k
VIEW_WIDTH = round((X1 - X0) * k)
PAD = 3  # source px of air around each letter crop


def trace_letter(index):
    """Potrace one solid-body component at the wordmark's resolution."""
    left, top, width, height = (int(v) for v in stats[index][:4])
    cx0, cy0 = left - PAD, top - PAD
    cx1, cy1 = left + width + PAD, top + height + PAD
    own = cv2.dilate((labels == index).astype(np.uint8), np.ones((5, 5), np.uint8))
    letter_alpha = np.where(own[cy0:cy1, cx0:cx1] > 0, alpha[cy0:cy1, cx0:cx1], 0).astype(np.float32)
    size = (round((cx1 - cx0) * k), round((cy1 - cy0) * k))
    sx, sy = size[0] / (cx1 - cx0), size[1] / (cy1 - cy0)
    big = cv2.resize(letter_alpha, size, interpolation=cv2.INTER_CUBIC) > ALPHA_CUT
    curves = potrace.Bitmap(~big).trace(turdsize=3, alphamax=1, opticurve=True, opttolerance=0.3)

    # potrace points are pixel-edge coordinates of the resampled crop.
    def point(p):
        x = (cx0 + p.x / sx - left) * k      # local: 0 at the letter's left edge
        y = (cy0 + p.y / sy - Y0) * k        # viewBox y
        return f'{x:.2f},{y:.2f}'

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
    return dict(left=left, width=width, path=' '.join(subpaths))


# ---------- path geometry shared by the IoU check and the proof renderer ----------
def flatten(d, steps=24):
    """Absolute M/L/C/Z path data -> list of closed polylines (float arrays)."""
    tokens = d.replace(',', ' ').split()
    polys, poly, i, cmd = [], None, 0, ''
    cx = cy = 0.0
    while i < len(tokens):
        if tokens[i] in 'MLCZ':
            cmd = tokens[i]
            i += 1
        if cmd == 'M':
            cx, cy = float(tokens[i]), float(tokens[i + 1]); i += 2
            poly = [(cx, cy)]
            polys.append(poly)
            cmd = 'L'
        elif cmd == 'L':
            cx, cy = float(tokens[i]), float(tokens[i + 1]); i += 2
            poly.append((cx, cy))
        elif cmd == 'C':
            x1, y1, x2, y2, x, y = (float(t) for t in tokens[i:i + 6]); i += 6
            t = np.linspace(0, 1, steps + 1)[1:, None]
            u = 1 - t
            pts = (u ** 3) * [cx, cy] + 3 * u * u * t * [x1, y1] + 3 * u * t * t * [x2, y2] + (t ** 3) * [x, y]
            poly.extend(map(tuple, pts))
            cx, cy = x, y
        elif cmd == 'Z':
            cmd = ''
    return [np.array(p) for p in polys]


def coverage(polys, shape, transform, ss=8):
    """Even-odd coverage (0..1) of transformed polylines on a pixel grid, ss x ss supersampled."""
    h, w = shape
    acc = np.zeros((h * ss, w * ss), np.uint8)
    for p in polys:
        q = transform(p) * ss
        layer = np.zeros_like(acc)
        cv2.fillPoly(layer, [np.round(q * 16).astype(np.int32)], 1, lineType=cv2.LINE_8, shift=4)
        acc ^= layer
    return acc.reshape(h, ss, w, ss).mean(axis=(1, 3))


glyphs, report = [], []
for char, gid, index in zip(CHARS, IDS, components):
    traced = trace_letter(index)
    left = traced['left']
    glyphs.append(dict(id=gid, char=char, width=round(traced['width'] * k, 2),
                       x=round((left - X0) * k, 2), path=traced['path']))
    # IoU on the source pixel grid against this letter's solid-body mask.
    target = labels == index
    back = coverage(flatten(traced['path']), target.shape,
                    lambda p, left=left: np.column_stack([p[:, 0] / k + left, p[:, 1] / k + Y0])) > 0.5
    iou = np.logical_and(back, target).sum() / np.logical_or(back, target).sum()
    report.append((char, iou, traced['path'].count('M'), traced['path'].count('C')))

data = json.dumps(glyphs, indent=2)
module = '''/**
 * SAY HELLO — editable cubic silhouettes traced from the supplied sign-off art
 * (assets-src/say-hello-original.png) by scripts/trace-say-hello.py, the same
 * potrace pipeline that produced SUPHIAN. Only the opaque letter bodies were
 * traced; the raster's glow, soft fringe and dark rim are left out.
 *
 * Units are the wordmark's: the median cap height matches SUPHIAN's, so the
 * shared gradient and grain land at the same scale on both words. Every letter
 * is an independent group (A and O keep their counters). Generated file: edit
 * the script, not the paths.
 */
import { LETTERING_DEFS as WORDMARK_DEFS } from '../wordmark/lettering.js';

export const VIEWBOX = { width: __W__, height: __H__ };

/** Re-id SVG markup the way createLogoSvg does, so copies never share ids. */
export function prefixIds(markup, prefix) {
  if (!prefix) return markup;
  return markup.replace(/id="([^"]+)"/g, (_, id) => `id="${prefix}${id}"`)
    .replace(/url\\(#([^)]+)\\)/g, (_, id) => `url(#${prefix}${id})`);
}

/** The inline copy's id prefix: the page also inlines the wordmark's defs. */
export const ID_PREFIX = 'sh-';

/** The wordmark's exact gradient (#letter-red) and grain (#letter-surface), re-id'd. */
export const LETTERING_DEFS = prefixIds(WORDMARK_DEFS, ID_PREFIX);

const tracedGlyphs = __DATA__;

const silhouette = (glyph) => `<path class="letter-silhouette" d="${glyph.path}" fill="url(#letter-red)" fill-rule="evenodd" filter="url(#letter-surface)"/>`;

export const LETTERS = tracedGlyphs.map(glyph => ({
  ...glyph,
  markup: prefixIds(silhouette(glyph), ID_PREFIX),
}));

/** Standalone, editable SAY HELLO SVG built from the traced geometry. */
export function createSayHelloSvg({ idPrefix = '' } = {}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX.width} ${VIEWBOX.height}" role="img" aria-labelledby="say-hello-title say-hello-description">
  <title id="say-hello-title">SAY HELLO — inflated red lettering</title>
  <desc id="say-hello-description">Editable cubic paths traced from the Say Hello sign-off art, drawn with the SUPHIAN wordmark's red gradient and surface grain. Each character is a separate named group. Transparent background.</desc>
  <metadata>Source-derived vector tracing; no fonts or embedded raster images.</metadata>
  <defs>${WORDMARK_DEFS}</defs>
  ${tracedGlyphs.map(glyph => `<g id="letter-${glyph.id}" data-letter="${glyph.char}" transform="translate(${glyph.x} 0)">${silhouette(glyph)}</g>`).join('\\n  ')}
</svg>\\n`;
  return prefixIds(svg, idPrefix)
    .replace('aria-labelledby="say-hello-title say-hello-description"', `aria-labelledby="${idPrefix}say-hello-title ${idPrefix}say-hello-description"`);
}
'''.replace('__DATA__', data).replace('__W__', str(VIEW_WIDTH)).replace('__H__', str(VIEW_HEIGHT))
(root / 'src' / 'sayhello').mkdir(exist_ok=True)
(root / 'src' / 'sayhello' / 'lettering.js').write_text(module, encoding='utf-8')

print(f'scale k={k:.4f} units/px  viewBox={VIEW_WIDTH}x{VIEW_HEIGHT}  X0={X0:.2f}px Y0={Y0:.2f}px')
for glyph, (char, iou, contours, curves) in zip(glyphs, report):
    print(f"{char} x={glyph['x']:8.2f} width={glyph['width']:7.2f} contours={contours} curves={curves:3d} IoU={iou:.4f}")
print(f'min IoU {min(r[1] for r in report):.4f}  mean IoU {np.mean([r[1] for r in report]):.4f}')


# =====================================================================
# Proof renders (--proof): one renderer for both words.
# =====================================================================
BSIZE, BM, PERLIN_N = 0x100, 0xff, 0x1000


def turbulence_tables(seed):
    """The SVG 1.1 feTurbulence reference init(), verbatim in Python."""
    RAND_m, RAND_a, RAND_q, RAND_r = 2147483647, 16807, 127773, 2836

    def rnd(s):
        r = RAND_a * (s % RAND_q) - RAND_r * (s // RAND_q)
        return r + RAND_m if r <= 0 else r

    s = seed
    if s <= 0:
        s = -(s % (RAND_m - 1)) + 1
    if s > RAND_m - 1:
        s = RAND_m - 1
    lattice = list(range(BSIZE)) + [0] * (BSIZE + 2)
    grad = np.zeros((4, BSIZE + BSIZE + 2, 2))
    for c in range(4):
        for i in range(BSIZE):
            for j in range(2):
                s = rnd(s)
                grad[c, i, j] = ((s % (BSIZE + BSIZE)) - BSIZE) / BSIZE
            grad[c, i] /= np.hypot(*grad[c, i])
    i = BSIZE - 1
    while i:
        kk = lattice[i]
        s = rnd(s)
        j = s % BSIZE
        lattice[i] = lattice[j]
        lattice[j] = kk
        i -= 1
    for i in range(BSIZE + 2):
        lattice[BSIZE + i] = lattice[i]
        grad[:, BSIZE + i] = grad[:, i]
    return np.array(lattice), grad


def noise2(lattice, grad, c, x, y):
    t = x + PERLIN_N
    bx0 = t.astype(np.int64) & BM
    bx1 = (bx0 + 1) & BM
    rx0 = t - t.astype(np.int64)
    rx1 = rx0 - 1
    t = y + PERLIN_N
    by0 = t.astype(np.int64) & BM
    by1 = (by0 + 1) & BM
    ry0 = t - t.astype(np.int64)
    ry1 = ry0 - 1
    i, j = lattice[bx0], lattice[bx1]
    b00, b10, b01, b11 = lattice[i + by0], lattice[j + by0], lattice[i + by1], lattice[j + by1]
    sx, sy = rx0 * rx0 * (3 - 2 * rx0), ry0 * ry0 * (3 - 2 * ry0)
    g = grad[c]
    u = rx0 * g[b00, 0] + ry0 * g[b00, 1]
    v = rx1 * g[b10, 0] + ry0 * g[b10, 1]
    a = u + sx * (v - u)
    u = rx0 * g[b01, 0] + ry1 * g[b01, 1]
    v = rx1 * g[b11, 0] + ry1 * g[b11, 1]
    b = u + sx * (v - u)
    return a + sy * (b - a)


def fractal_noise(tables, x, y, freq=0.72, octaves=3):
    """feTurbulence type=fractalNoise, RGBA in 0..1 (stitchTiles ignored)."""
    lattice, grad = tables
    out = []
    for c in range(4):
        total, vx, vy, ratio = 0.0, x * freq, y * freq, 1.0
        for _ in range(octaves):
            total = total + noise2(lattice, grad, c, vx, vy) / ratio
            vx, vy, ratio = vx * 2, vy * 2, ratio * 2
        out.append(np.clip((total + 1) / 2, 0, 1))
    return out


def soft_light(cb, cs):
    d = np.where(cb <= 0.25, ((16 * cb - 12) * cb + 4) * cb, np.sqrt(cb))
    return np.where(cs <= 0.5, cb - (1 - 2 * cs) * cb * (1 - cb), cb + (2 * cs - 1) * (d - cb))


STOPS = [(0, (0xfb, 0x27, 0x26)), (0.56, (0xfb, 0x24, 0x23)), (1, (0xfa, 0x23, 0x22))]


def gradient(y):
    """#letter-red: vertical, userSpaceOnUse 0..592, sRGB 0..1."""
    t = np.clip(y / 592, 0, 1)
    pos = [s[0] for s in STOPS]
    return [np.interp(t, pos, [s[1][c] / 255 for s in STOPS]) for c in range(3)]


def render_word(canvas, letters, scale, ox, oy, tables):
    """Draw each letter group (translate(x 0)) at scale, offset (ox, oy) px, onto an sRGB float canvas."""
    H, W, _ = canvas.shape
    for letter in letters:
        polys = flatten(letter['path'])
        pts = np.vstack(polys)
        gx = letter['x']
        x0 = max(int(np.floor(ox + (gx + pts[:, 0].min()) * scale)) - 2, 0)
        x1 = min(int(np.ceil(ox + (gx + pts[:, 0].max()) * scale)) + 2, W)
        y0 = max(int(np.floor(oy + pts[:, 1].min() * scale)) - 2, 0)
        y1 = min(int(np.ceil(oy + pts[:, 1].max() * scale)) + 2, H)
        a_s = coverage(polys, (y1 - y0, x1 - x0),
                       lambda p: np.column_stack([ox + (gx + p[:, 0]) * scale - x0, oy + p[:, 1] * scale - y0]))
        # User-space coordinates (the letter's local frame) at each pixel centre.
        px, py = np.meshgrid(np.arange(x0, x1) + 0.5, np.arange(y0, y1) + 0.5)
        ux, uy = (px - ox) / scale - gx, (py - oy) / scale
        cs = gradient(uy)
        nr, ng, nb, na = fractal_noise(tables, ux, uy)
        gray = np.clip(0.213 * nr + 0.715 * ng + 0.072 * nb, 0, 1)   # feColorMatrix saturate 0
        a_b = 0.16 * na * a_s                                        # slope .16, then "in" SourceAlpha
        a_r = a_s + a_b - a_s * a_b
        for c in range(3):
            # feBlend soft-light: in = SourceGraphic (source), in2 = grain (backdrop); premultiplied.
            cr = (1 - a_b) * cs[c] * a_s + (1 - a_s) * gray * a_b + a_s * a_b * soft_light(gray, cs[c])
            region = canvas[y0:y1, x0:x1, c]
            canvas[y0:y1, x0:x1, c] = cr + (1 - a_r) * region


def to_image(canvas):
    return Image.fromarray(np.round(np.clip(canvas, 0, 1) * 255).astype(np.uint8))


def median_cap(letters):
    return float(np.median([np.ptp(np.vstack(flatten(l['path']))[:, 1]) for l in letters]))


def stroke_stats(letters, scale):
    """Median stroke thickness, at a given scale, from the distance transform ridge."""
    out = []
    for letter in letters:
        polys = flatten(letter['path'])
        pts = np.vstack(polys)
        w, h = int(np.ptp(pts[:, 0]) * scale) + 8, int(np.ptp(pts[:, 1]) * scale) + 8
        m = coverage(polys, (h, w), lambda p: np.column_stack([(p[:, 0] - pts[:, 0].min()) * scale + 4,
                                                               (p[:, 1] - pts[:, 1].min()) * scale + 4]), ss=2) > 0.5
        dist = cv2.distanceTransform(m.astype(np.uint8), cv2.DIST_L2, 5)
        ridge = (dist >= cv2.dilate(dist, np.ones((3, 3), np.uint8))) & (dist > 2)
        out.append(2 * float(np.median(dist[ridge])))
    return out


if PROOF:
    wordmark = json.loads(subprocess.check_output(
        ['node', '--input-type=module', '-e',
         "import { LETTERS, FULL_VIEWBOX } from './src/wordmark/lettering.js';"
         "console.log(JSON.stringify({ letters: LETTERS.map(({ x, path, char }) => ({ x, path, char })), view: FULL_VIEWBOX }));"],
        cwd=root))
    say = [dict(x=g['x'], path=g['path'], char=g['char']) for g in glyphs]
    cap_w, cap_s = median_cap(wordmark['letters']), median_cap(say)
    print(f'median cap height: SUPHIAN {cap_w:.2f} units, SAY HELLO {cap_s:.2f} units (ratio {cap_s / cap_w:.4f})')
    tables = turbulence_tables(17)
    bg = np.array([8, 8, 8]) / 255

    # 1. SUPHIAN above SAY HELLO, same renderer, same scale => same cap height.
    scale = 0.8
    margin = 60
    W = int(max(wordmark['view']['width'], VIEW_WIDTH) * scale) + 2 * margin
    H = int((wordmark['view']['height'] + VIEW_HEIGHT) * scale) + 3 * margin
    canvas = np.ones((H, W, 3)) * bg
    render_word(canvas, wordmark['letters'], scale, (W - wordmark['view']['width'] * scale) / 2, margin, tables)
    render_word(canvas, say, scale, (W - VIEW_WIDTH * scale) / 2, 2 * margin + wordmark['view']['height'] * scale, tables)
    # Zoom strip: the S of each word at 1.1 px per unit, to judge edge, red and grain up close.
    zs = 1.1
    zoom = np.ones((int(592 * zs) + 40, int(700 * zs), 3)) * bg
    render_word(zoom, [dict(wordmark['letters'][0], x=0)], zs, 20, 10, tables)
    render_word(zoom, [dict(say[0], x=0)], zs, 20 + 340 * zs, 10, tables)
    sheet = np.ones((H + zoom.shape[0], W, 3)) * bg
    sheet[:H] = canvas
    sheet[H:, :zoom.shape[1]] = zoom
    to_image(sheet).save(root / 'qa' / 'say-hello-vs-wordmark.png')

    # 2. Original PNG beside the vector (same pixel box, source px -> units via k).
    src = Image.open(source).convert('RGBA')
    crop_box = (int(X0), int(Y0), int(X0 + VIEW_WIDTH / k), int(Y0 + VIEW_HEIGHT / k))
    art = src.crop(crop_box)
    art_bg = Image.new('RGBA', art.size, (8, 8, 8, 255))
    art_bg.alpha_composite(art)
    vec = np.ones((art.size[1], art.size[0], 3)) * bg
    render_word(vec, say, 1 / k, X0 - int(X0), Y0 - int(Y0), tables)
    compare = Image.new('RGB', (art.size[0], art.size[1] * 2 + 20), (8, 8, 8))
    compare.paste(art_bg.convert('RGB'), (0, 0))
    compare.paste(to_image(vec), (0, art.size[1] + 20))
    compare.save(root / 'qa' / 'say-hello-compare.png')

    sw = stroke_stats(wordmark['letters'], 1.0)
    ss = stroke_stats(say, 1.0)
    print('stroke thickness (units, median ridge width) SUPHIAN:',
          ' '.join(f"{l['char']}={v:.0f}" for l, v in zip(wordmark['letters'], sw)), f'median={np.median(sw):.0f}')
    print('stroke thickness (units, median ridge width) SAY HELLO:',
          ' '.join(f"{l['char']}={v:.0f}" for l, v in zip(say, ss)), f'median={np.median(ss):.0f}')
    print('wrote qa/say-hello-vs-wordmark.png, qa/say-hello-compare.png')
