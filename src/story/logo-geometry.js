/**
 * Logo geometry for the story cards' optical centring. Test-time only: nothing
 * in the app imports this. logo-geometry.test.mjs runs it on the real logos in
 * public/work and checks the nudges stored in content.js (story.chapters[].image).
 *
 * A card centres its logo's box: the SVG viewBox, which is tight to the ink.
 * For a wordmark with a descending "g" (Huge, Google) that box reaches down to
 * the tail of the g, which carries almost no weight, so the letters look high.
 * The nudge moves the logo down until the centre of its cap/x-height mass (all
 * the ink above the baseline, measured from the real paths) sits on the card's
 * centre, and the descender hangs below it, as in type.
 */

const NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;
const TOKEN = /[MmLlHhVvCcSsQqTtAaZz]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;

/** t in (0, 1) where one coordinate of a Bézier segment turns around (derivative roots). */
function cubicTurns(p0, p1, p2, p3) {
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = p1 - p0;
  const roots = [];
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) roots.push(-c / b);
  } else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const s = Math.sqrt(disc);
      roots.push((-b + s) / (2 * a), (-b - s) / (2 * a));
    }
  }
  return roots.filter((t) => t > 0 && t < 1);
}
const cubicAt = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};
function quadTurns(p0, p1, p2) {
  const den = p0 - 2 * p1 + p2;
  if (Math.abs(den) < 1e-12) return [];
  const t = (p0 - p1) / den;
  return t > 0 && t < 1 ? [t] : [];
}
const quadAt = (p0, p1, p2, t) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;

/**
 * An elliptical arc (path command A) from (x0, y0) to (x, y) as cubic Béziers of
 * at most 90° each, by the SVG spec's endpoint-to-centre conversion (SVG 1.1
 * F.6.5), with its fixes for out-of-range radii (F.6.6): radii too small to
 * span the chord grow just enough, a zero radius is a straight line (null), and
 * an arc that ends where it starts draws nothing ([]). Each piece is
 * [x1, y1, x2, y2, x3, y3] and starts where the previous one ends. A quarter-arc
 * cubic strays from the true ellipse by under 0.03% of its radius; ends of
 * pieces, the ends of the arc included, sit exactly on it.
 */
export function arcCubics(x0, y0, rxIn, ryIn, degrees, large, sweep, x, y) {
  if (x0 === x && y0 === y) return [];
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (!(rx > 0) || !(ry > 0)) return null;
  const phi = ((degrees % 360) * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  // The start point in the ellipse's own frame, relative to the chord's midpoint.
  const dx = (x0 - x) / 2;
  const dy = (y0 - y) / 2;
  const px = cos * dx + sin * dy;
  const py = -sin * dx + cos * dy;
  const reach = (px * px) / (rx * rx) + (py * py) / (ry * ry);
  if (reach > 1) {
    rx *= Math.sqrt(reach);
    ry *= Math.sqrt(reach);
  }
  // The centre: in that frame, then in user space.
  const spread = rx * rx * py * py + ry * ry * px * px;
  const coef = (large !== sweep ? 1 : -1) * Math.sqrt(Math.max(0, (rx * rx * ry * ry - spread) / spread));
  const cpx = (coef * rx * py) / ry;
  const cpy = (-coef * ry * px) / rx;
  const cx = cos * cpx - sin * cpy + (x0 + x) / 2;
  const cy = sin * cpx + cos * cpy + (y0 + y) / 2;
  // Start angle and signed sweep on the unit circle; the sweep flag picks the direction.
  const ux = (px - cpx) / rx;
  const uy = (py - cpy) / ry;
  const vx = (-px - cpx) / rx;
  const vy = (-py - cpy) / ry;
  const start = Math.atan2(uy, ux);
  let turn = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  if (!sweep && turn > 0) turn -= 2 * Math.PI;
  else if (sweep && turn < 0) turn += 2 * Math.PI;
  const count = Math.max(1, Math.ceil(Math.abs(turn) / (Math.PI / 2) - 1e-9));
  const step = turn / count;
  const k = (4 / 3) * Math.tan(step / 4);
  const onEllipse = (u, v) => [cx + rx * cos * u - ry * sin * v, cy + rx * sin * u + ry * cos * v];
  const pieces = [];
  for (let n = 0; n < count; n++) {
    const a = start + n * step;
    const b = a + step;
    const [ca, sa, cb, sb] = [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b)];
    pieces.push([...onEllipse(ca - k * sa, sa + k * ca), ...onEllipse(cb + k * sb, sb - k * cb), ...onEllipse(cb, sb)]);
  }
  // The arc ends exactly on its end point, not a rounding error away.
  pieces[count - 1][4] = x;
  pieces[count - 1][5] = y;
  return pieces;
}

/**
 * Walks SVG path data in absolute coordinates: M L H V C S Q T A Z, absolute and
 * relative. Calls visit.move(x, y), visit.line(x0, y0, x1, y1),
 * visit.cubic(x0, y0, x1, y1, x2, y2, x3, y3), visit.quad(x0, y0, x1, y1, x2, y2)
 * and visit.close(). H and V arrive as lines, elliptical arcs as cubics
 * (arcCubics; a zero radius as a line). Anything else throws, so a logo that
 * starts using it fails loudly instead of being measured wrong.
 */
function walkPath(d, visit) {
  const tokens = String(d).match(TOKEN) || [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let cx = null; // Last cubic control point (for S).
  let cy = null;
  let qx = null; // Last quadratic control point (for T).
  let qy = null;
  const num = () => {
    const value = Number(tokens[i++]);
    if (!Number.isFinite(value)) throw new Error(`Bad path number near token ${i - 1}`);
    return value;
  };
  const isNumber = (token) => token !== undefined && /^[+-]?(\d|\.\d)/.test(token);
  // An arc flag is one digit, 0 or 1, and exporters pack them into the numbers
  // around them: "A5 5 0 110 5" is the flags 1 and 1, then the end point (0, 5).
  const flag = () => {
    const token = tokens[i];
    if (token === undefined || !/^[01]/.test(token)) throw new Error(`Bad arc flag near token ${i}`);
    if (token.length > 1) tokens[i] = token.slice(1);
    else i++;
    return token[0] === '1';
  };
  const lineTo = (nx, ny) => {
    visit.line(x, y, nx, ny);
    x = nx;
    y = ny;
    cx = cy = qx = qy = null;
  };

  while (i < tokens.length) {
    if (!isNumber(tokens[i])) cmd = tokens[i++];
    else if (!cmd) throw new Error('Path data must start with a command');
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'M':
        x = ox + num();
        y = oy + num();
        sx = x;
        sy = y;
        visit.move(x, y);
        cmd = rel ? 'l' : 'L'; // Extra pairs after a move are line-tos.
        cx = cy = qx = qy = null;
        break;
      case 'L': {
        const nx = ox + num();
        lineTo(nx, oy + num());
        break;
      }
      case 'H':
        lineTo(ox + num(), y);
        break;
      case 'V':
        lineTo(x, oy + num());
        break;
      case 'C':
      case 'S': {
        let x1;
        let y1;
        if (cmd.toUpperCase() === 'C') {
          x1 = ox + num();
          y1 = oy + num();
        } else {
          x1 = cx === null ? x : 2 * x - cx;
          y1 = cy === null ? y : 2 * y - cy;
        }
        const x2 = ox + num();
        const y2 = oy + num();
        const x3 = ox + num();
        const y3 = oy + num();
        visit.cubic(x, y, x1, y1, x2, y2, x3, y3);
        x = x3;
        y = y3;
        cx = x2;
        cy = y2;
        qx = qy = null;
        break;
      }
      case 'Q':
      case 'T': {
        let x1;
        let y1;
        if (cmd.toUpperCase() === 'Q') {
          x1 = ox + num();
          y1 = oy + num();
        } else {
          x1 = qx === null ? x : 2 * x - qx;
          y1 = qy === null ? y : 2 * y - qy;
        }
        const x2 = ox + num();
        const y2 = oy + num();
        visit.quad(x, y, x1, y1, x2, y2);
        x = x2;
        y = y2;
        qx = x1;
        qy = y1;
        cx = cy = null;
        break;
      }
      case 'Z':
        visit.close();
        x = sx;
        y = sy;
        cx = cy = qx = qy = null;
        cmd = ''; // Numbers straight after a close are malformed: throw, don't loop.
        break;
      case 'A': {
        const rx = num();
        const ry = num();
        const rotation = num();
        const large = flag();
        const sweep = flag();
        const nx = ox + num();
        const ny = oy + num();
        const pieces = arcCubics(x, y, rx, ry, rotation, large, sweep, nx, ny);
        if (pieces === null) {
          lineTo(nx, ny);
          break;
        }
        for (const [x1, y1, x2, y2, x3, y3] of pieces) {
          visit.cubic(x, y, x1, y1, x2, y2, x3, y3);
          x = x3;
          y = y3;
        }
        cx = cy = qx = qy = null; // An S or T after an arc has nothing to reflect.
        break;
      }
      default:
        throw new Error(`Unknown path command ${cmd}`);
    }
  }
}

/** Tight bounds of SVG path data: { left, top, right, bottom }, with curve extrema. */
export function pathBounds(d) {
  const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
  const add = (x, y) => {
    if (x < box.left) box.left = x;
    if (x > box.right) box.right = x;
    if (y < box.top) box.top = y;
    if (y > box.bottom) box.bottom = y;
  };
  walkPath(d, {
    move: add,
    line: (x0, y0, x1, y1) => add(x1, y1),
    // Each extremum is added with the segment's start point as its other
    // coordinate. That point is already in the box, so only its own axis widens.
    cubic(x0, y0, x1, y1, x2, y2, x3, y3) {
      for (const t of cubicTurns(x0, x1, x2, x3)) add(cubicAt(x0, x1, x2, x3, t), y0);
      for (const t of cubicTurns(y0, y1, y2, y3)) add(x0, cubicAt(y0, y1, y2, y3, t));
      add(x3, y3);
    },
    quad(x0, y0, x1, y1, x2, y2) {
      for (const t of quadTurns(x0, x1, x2)) add(quadAt(x0, x1, x2, t), y0);
      for (const t of quadTurns(y0, y1, y2)) add(x0, quadAt(y0, y1, y2, t));
      add(x2, y2);
    },
    close() {},
  });
  if (!Number.isFinite(box.left)) throw new Error('Empty path');
  return box;
}

/**
 * The path as straight edges [x0, y0, x1, y1] (curves split into `steps`
 * pieces), every subpath closed, as a renderer fills it.
 */
export function pathEdges(d, { steps = 32 } = {}) {
  const edges = [];
  let start = null;
  let last = null;
  const push = (x0, y0, x1, y1) => {
    edges.push([x0, y0, x1, y1]);
    last = [x1, y1];
  };
  const closeOpen = () => {
    if (start && last && (last[0] !== start[0] || last[1] !== start[1])) push(last[0], last[1], start[0], start[1]);
  };
  walkPath(d, {
    move(x, y) {
      closeOpen();
      start = [x, y];
      last = [x, y];
    },
    line: push,
    cubic(x0, y0, x1, y1, x2, y2, x3, y3) {
      let px = x0;
      let py = y0;
      for (let k = 1; k <= steps; k++) {
        const t = k / steps;
        const nx = cubicAt(x0, x1, x2, x3, t);
        const ny = cubicAt(y0, y1, y2, y3, t);
        push(px, py, nx, ny);
        px = nx;
        py = ny;
      }
    },
    quad(x0, y0, x1, y1, x2, y2) {
      let px = x0;
      let py = y0;
      for (let k = 1; k <= steps; k++) {
        const t = k / steps;
        const nx = quadAt(x0, x1, x2, t);
        const ny = quadAt(y0, y1, y2, t);
        push(px, py, nx, ny);
        px = nx;
        py = ny;
      }
    },
    close() {
      closeOpen();
      if (start) last = [...start];
    },
  });
  closeOpen();
  return edges;
}

const attr = (tag, name) => {
  const match = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return match ? match[1] : null;
};

/**
 * The viewBox and one glyph per <path> or <rect> (true of every logo in
 * public/work): its tight box (left, top, right, bottom), its straight edges and
 * its fill rule. Transforms are refused rather than ignored.
 */
export function svgGlyphs(svg) {
  const text = String(svg);
  if (/\btransform=/.test(text)) throw new Error('SVG transforms are not supported');
  const root = /<svg\b[^>]*>/.exec(text);
  const viewBox = root && attr(root[0], 'viewBox');
  if (!viewBox) throw new Error('The logo needs a viewBox');
  const [vx, vy, vw, vh] = viewBox.match(NUMBER).map(Number);
  const rootRule = attr(root[0], 'fill-rule');
  const glyphs = [];
  for (const [tag] of text.matchAll(/<(path|rect)\b[^>]*>/g)) {
    const rule = (attr(tag, 'fill-rule') ?? rootRule) === 'evenodd' ? 'evenodd' : 'nonzero';
    if (tag.startsWith('<path')) {
      const d = attr(tag, 'd');
      glyphs.push({ ...pathBounds(d), edges: pathEdges(d), rule });
    } else {
      const x = Number(attr(tag, 'x') ?? 0);
      const y = Number(attr(tag, 'y') ?? 0);
      const right = x + Number(attr(tag, 'width'));
      const bottom = y + Number(attr(tag, 'height'));
      const edges = [
        [x, y, right, y],
        [right, y, right, bottom],
        [right, bottom, x, bottom],
        [x, bottom, x, y],
      ];
      glyphs.push({ left: x, top: y, right, bottom, edges, rule });
    }
  }
  if (!glyphs.length) throw new Error('No glyphs found');
  return { viewBox: { x: vx, y: vy, width: vw, height: vh }, glyphs };
}

/** The x-intervals a glyph fills along the horizontal line at `y`, by its fill rule. */
function glyphSpans({ edges, rule }, y) {
  const hits = [];
  for (const [x0, y0, x1, y1] of edges) {
    if (y0 === y1) continue;
    const up = y0 < y1;
    const lo = up ? y0 : y1;
    const hi = up ? y1 : y0;
    if (y < lo || y >= hi) continue;
    hits.push([x0 + ((y - y0) * (x1 - x0)) / (y1 - y0), up ? 1 : -1]);
  }
  hits.sort((a, b) => a[0] - b[0]);
  const spans = [];
  let winding = 0;
  for (let k = 0; k < hits.length - 1; k++) {
    winding += hits[k][1];
    const inside = rule === 'evenodd' ? k % 2 === 0 : winding !== 0;
    if (inside && hits[k + 1][0] > hits[k][0]) spans.push([hits[k][0], hits[k + 1][0]]);
  }
  return spans;
}

/** Total length of a set of intervals, overlaps counted once. */
function unionLength(spans) {
  const sorted = [...spans].sort((a, b) => a[0] - b[0]);
  let total = 0;
  let end = -Infinity;
  for (const [a, b] of sorted) {
    if (b <= end) continue;
    total += b - Math.max(a, end);
    end = b;
  }
  return total;
}

/**
 * Filled area of the glyphs between y = from and y = to, and the height of its
 * centre of mass: horizontal slices, each as wide as the ink it crosses
 * (overlapping glyphs counted once).
 */
export function inkMass(glyphs, { from, to, slices = 2000 } = {}) {
  let mass = 0;
  let moment = 0;
  const dy = (to - from) / slices;
  if (!(dy > 0)) return { mass: 0, centre: NaN };
  for (let s = 0; s < slices; s++) {
    const y = from + (s + 0.5) * dy;
    const width = unionLength(glyphs.flatMap((glyph) => glyphSpans(glyph, y)));
    mass += width * dy;
    moment += width * dy * y;
  }
  return { mass, centre: mass > 0 ? moment / mass : NaN };
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Optical nudge for a logo on its card, as a fraction of the logo's height
 * (positive moves it down); 0 unless a glyph descends.
 * - Cap line: the highest glyph top. Baseline: the median glyph bottom.
 * - A descender starts clearly below the cap line and ends clearly below the
 *   baseline (a lowercase g). A full-height mark, like YouTube's play button,
 *   starts on the cap line, so it is not one.
 * - With a descender, the nudge brings the centre of mass of the ink above the
 *   baseline (re-measured without the descenders) to the viewBox's centre: the
 *   cap/x-height mass, the part of the word the eye reads as the word.
 */
export function opticalNudge(svg, { threshold = 0.15 } = {}) {
  const { viewBox, glyphs } = svgGlyphs(svg);
  const cap = Math.min(...glyphs.map((g) => g.top));
  const roughBaseline = median(glyphs.map((g) => g.bottom));
  const band = roughBaseline - cap;
  const descends = (g) => g.top > cap + threshold * band && g.bottom > roughBaseline + threshold * band;
  if (!(band > 0) || !glyphs.some(descends)) return 0;
  const baseline = median(glyphs.filter((g) => !descends(g)).map((g) => g.bottom));
  const { centre } = inkMass(glyphs, { from: viewBox.y, to: baseline });
  if (!Number.isFinite(centre)) return 0;
  const boxCentre = viewBox.y + viewBox.height / 2;
  return Math.round(((boxCentre - centre) / viewBox.height) * 1000) / 1000;
}
