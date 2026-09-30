import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { collectWebVitals } from './webVitals.js';

// Runs collectWebVitals against fake web-vitals callbacks, a fake document and mocked timers.
function setup() {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const sent = [];
  const callbacks = {};
  const listeners = [];
  const doc = { visibilityState: 'visible', addEventListener: (type, fn) => listeners.push(fn) };
  const on = (name) => (cb) => {
    callbacks[name] = cb;
  };
  collectWebVitals((event, properties) => sent.push({ event, properties }), {
    onCLS: on('CLS'),
    onFCP: on('FCP'),
    onINP: on('INP'),
    onLCP: on('LCP'),
    now: () => Date.now(),
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    document: doc,
    href: () => 'https://suphian.com/',
  });
  const report = (name, value) =>
    callbacks[name]({ name, value, rating: 'good', delta: value, id: `${name}-1`, navigationType: 'navigate' });
  const hide = () => {
    doc.visibilityState = 'hidden';
    for (const fn of listeners) fn();
  };
  return { sent, report, hide };
}

test('flushes 5 s after the first metric, with what has arrived', (t) => {
  t.after(() => mock.timers.reset());
  const { sent, report } = setup();
  report('FCP', 800);
  mock.timers.tick(4999);
  assert.equal(sent.length, 0);
  mock.timers.tick(1);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].event, '$web_vitals');
  assert.equal(sent[0].properties.$web_vitals_FCP_value, 800);
  assert.equal(sent[0].properties.$web_vitals_FCP_event.$current_url, 'https://suphian.com/');
  assert.equal('$web_vitals_LCP_value' in sent[0].properties, false);
});

test('flushes as soon as all four metrics are in, and the timer is cleared', (t) => {
  t.after(() => mock.timers.reset());
  const { sent, report } = setup();
  report('FCP', 800);
  report('LCP', 1200);
  report('CLS', 0.01);
  assert.equal(sent.length, 0);
  report('INP', 90);
  assert.equal(sent.length, 1);
  assert.deepEqual(
    Object.keys(sent[0].properties)
      .filter((key) => key.endsWith('_value'))
      .sort(),
    ['$web_vitals_CLS_value', '$web_vitals_FCP_value', '$web_vitals_INP_value', '$web_vitals_LCP_value'],
  );
  mock.timers.tick(10000);
  assert.equal(sent.length, 1, 'no second event from the cleared timer');
});

test('flushes on visibilitychange to hidden with what is buffered', (t) => {
  t.after(() => mock.timers.reset());
  const { sent, report, hide } = setup();
  report('LCP', 1500);
  hide();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].properties.$web_vitals_LCP_value, 1500);
  mock.timers.tick(10000);
  assert.equal(sent.length, 1, 'the hide flush cleared the timer');
});

test('drops values of 15 minutes or more', (t) => {
  t.after(() => mock.timers.reset());
  const { sent, report, hide } = setup();
  report('LCP', 900000);
  report('FCP', 1000000);
  mock.timers.tick(10000);
  hide();
  assert.equal(sent.length, 0);
  report('LCP', 899999);
  hide();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].properties.$web_vitals_LCP_value, 899999);
});

test('sends nothing on hide with an empty buffer', (t) => {
  t.after(() => mock.timers.reset());
  const { sent, hide } = setup();
  hide();
  assert.equal(sent.length, 0);
});

test('the latest value wins per metric', (t) => {
  t.after(() => mock.timers.reset());
  const { sent, report } = setup();
  report('CLS', 0.01);
  report('CLS', 0.2);
  mock.timers.tick(5000);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].properties.$web_vitals_CLS_value, 0.2);
});
