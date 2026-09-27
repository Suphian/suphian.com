import React, { useState } from 'react';
import { MOTION } from './motion.js';

/**
 * Dev-only motion tuning panel. Wordmark lazy-loads it when
 * import.meta.env.DEV and the URL has `?tune`, so it never ships.
 * Sliders write straight into MOTION (read live by the sim); "Copy config"
 * puts a MOTION literal on the clipboard to paste into motion.js.
 */
const DEFAULTS = { ...MOTION };

const GROUPS = [
  ['Choreography', [
    ['squeeze', 0, 0.2, 0.005],
    ['yieldTime', 0.02, 0.8, 0.01],
    ['tailStagger', 0, 0.15, 0.005],
    ['travel', 0.4, 1.6, 0.01],
  ]],
  ['Stiffness', [
    ['stiffness', 100, 2000, 10],
    ['tailStiffness', 50, 1500, 10],
    ['anchorStiffness', 100, 2500, 10],
    ['pistonStiffness', 100, 3000, 10],
    ['pistonPull', 0, 1, 0.01],
  ]],
  ['Damping', [
    ['damping', 0.2, 1.2, 0.01],
    ['drag', 0, 15, 0.1],
  ]],
  ['Mass', [
    ['mass', 0.2, 4, 0.05],
    ['tailMass', 0.1, 3, 0.05],
    ['pistonMass', 0.2, 5, 0.05],
  ]],
  ['Feel', [
    ['squash', 0, 1, 0.01],
    ['maxBulge', 1, 1.5, 0.01],
    ['tilt', 0, 6, 0.1],
    ['maxTilt', 0, 15, 0.5],
    ['inertia', 0, 0.6, 0.01],
    ['tailSink', 0, 0.8, 0.01],
  ]],
  ['Dock spring', [
    ['dockFrequency', 0.5, 4, 0.05],
    ['dockDamping', 0.3, 1.2, 0.01],
    ['dockOvershoot', 0, 0.05, 0.001],
  ]],
];

const round = (n) => Number(n.toPrecision(4));

export function motionLiteral(values = MOTION) {
  const lines = Object.keys(DEFAULTS).map((key) => `  ${key}: ${round(values[key])},`);
  return `export const MOTION = {\n${lines.join('\n')}\n};\n`;
}

/** Scripted scroll that behaves like a quick flick (native scroll, just fast). */
function flick(to, duration = 180) {
  const from = window.scrollY;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    window.scrollTo({ top: from + (to - from) * eased, behavior: 'instant' });
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function dockedScroll() {
  const hero = document.querySelector('[data-wordmark-hero]');
  const height = hero ? hero.getBoundingClientRect().height : window.innerHeight;
  return Math.ceil(height * MOTION.travel) + 24;
}

export default function TuningPanel({ controls }) {
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState(() => ({ ...MOTION }));
  const [slow, setSlow] = useState(false);
  const [copyState, setCopyState] = useState('');
  const [fallback, setFallback] = useState('');

  const apply = (patch) => {
    Object.assign(MOTION, patch);
    setValues({ ...MOTION });
    controls.current?.update();
  };

  const toggleSlow = () => {
    const next = !slow;
    setSlow(next);
    if (controls.current) controls.current.sim.timeScale = next ? 0.25 : 1;
  };

  const copy = async () => {
    const text = motionLiteral();
    setFallback('');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
      setCopyState('Copied');
      setTimeout(() => setCopyState(''), 1400);
    } catch {
      setCopyState('Select and copy below');
      setFallback(text);
    }
  };

  return (
    <aside className="wm-tune" aria-label="Wordmark motion tuning">
      <style>{STYLES}</style>
      <button type="button" className="wm-tune__bar" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>Motion tuning</span>
        <span aria-hidden="true">{open ? '–' : '+'}</span>
      </button>
      {open && (
        <div className="wm-tune__body">
          <div className="wm-tune__actions">
            <button type="button" onClick={() => flick(dockedScroll())}>Flick ↓</button>
            <button type="button" onClick={() => flick(0)}>Flick ↑</button>
            <button type="button" className={slow ? 'is-on' : ''} onClick={toggleSlow} aria-pressed={slow}>Slow-mo</button>
          </div>
          {GROUPS.map(([title, rows]) => (
            <fieldset key={title}>
              <legend>{title}</legend>
              {rows.map(([key, min, max, step]) => (
                <label key={key} className={values[key] !== DEFAULTS[key] ? 'is-changed' : ''}>
                  <span className="wm-tune__name">{key}</span>
                  <span className="wm-tune__value">{round(values[key])}</span>
                  <input
                    type="range" min={min} max={max} step={step} value={values[key]}
                    onChange={(event) => apply({ [key]: Number(event.target.value) })}
                  />
                </label>
              ))}
            </fieldset>
          ))}
          <div className="wm-tune__actions">
            <button type="button" onClick={() => apply(DEFAULTS)}>Reset</button>
            <button type="button" className="is-primary" onClick={copy}>Copy config</button>
          </div>
          {copyState && <p className="wm-tune__status" role="status">{copyState}</p>}
          {fallback && (
            <textarea readOnly value={fallback} rows={10} onFocus={(event) => event.target.select()} autoFocus />
          )}
        </div>
      )}
    </aside>
  );
}

const STYLES = `
.wm-tune { position: fixed; left: 16px; bottom: 16px; z-index: 60; width: 272px; max-height: calc(100dvh - 32px);
  display: flex; flex-direction: column; background: #080808; border: 1px solid #272727; color: #a3a3a3;
  font: 10px/1.4 'Courier New', Courier, monospace; letter-spacing: .08em; text-transform: uppercase; pointer-events: auto; }
.wm-tune button { font: inherit; letter-spacing: inherit; text-transform: inherit; color: inherit; background: none;
  border: 1px solid #272727; padding: 6px 8px; cursor: pointer; }
.wm-tune button:hover { color: #d2d2d2; border-color: #3a3a3a; }
.wm-tune button:focus-visible, .wm-tune input:focus-visible { outline: 1px solid #ed2921; outline-offset: 2px; }
.wm-tune .is-on, .wm-tune .is-primary { color: #ed2921; border-color: #ed2921; }
.wm-tune__bar { display: flex; justify-content: space-between; border: 0 !important; padding: 10px 12px !important;
  font-family: Arial, Helvetica, sans-serif !important; font-size: 10px; letter-spacing: .14em !important; }
.wm-tune__body { overflow-y: auto; padding: 0 12px 12px; border-top: 1px solid #272727; }
.wm-tune__actions { display: flex; gap: 6px; margin: 10px 0; }
.wm-tune__actions button { flex: 1; }
.wm-tune fieldset { border: 0; border-top: 1px solid #272727; margin: 0; padding: 8px 0 4px; }
.wm-tune legend { padding: 0 6px 0 0; color: #6a6a6a; font-family: Arial, Helvetica, sans-serif; letter-spacing: .14em; }
.wm-tune label { display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; margin: 4px 0 8px; }
.wm-tune label.is-changed .wm-tune__name { color: #ed2921; }
.wm-tune__name { text-transform: none; letter-spacing: .02em; }
.wm-tune__value { color: #d2d2d2; font-variant-numeric: tabular-nums; }
.wm-tune input[type=range] { grid-column: 1 / -1; width: 100%; margin: 0; accent-color: #ed2921; }
.wm-tune__status { margin: 0 0 8px; color: #ed2921; }
.wm-tune textarea { width: 100%; box-sizing: border-box; background: #0e0e0e; color: #d2d2d2; border: 1px solid #272727;
  font: 10px/1.4 'Courier New', Courier, monospace; text-transform: none; padding: 6px; resize: vertical; }
`;
