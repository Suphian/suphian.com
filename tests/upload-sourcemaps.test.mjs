import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { CLI, HOST, PROJECT_ID, deleteSourceMaps, uploadSourceMaps } from '../scripts/upload-sourcemaps.mjs';

const read = (file) => fs.readFileSync(new URL(file, import.meta.url), 'utf8');

// A dist/ like Vite's with hidden source maps: chunks and their maps, nested.
function fakeDist(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'suphian-dist-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const files = ['index.html', 'sw.js', 'assets/index-abc.js', 'assets/index-abc.js.map', 'assets/module.slim-def.js', 'assets/module.slim-def.js.map', 'assets/deep/nested/x.css.map', 'assets/deep/nested/x.css'];
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), file);
  }
  return dir;
}

function listFiles(dir) {
  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'))
    .sort();
}

test('deleteSourceMaps removes every .map at any depth and nothing else', (t) => {
  const dir = fakeDist(t);
  assert.equal(deleteSourceMaps(dir), 3);
  assert.deepEqual(listFiles(dir), ['assets/deep/nested/x.css', 'assets/index-abc.js', 'assets/module.slim-def.js', 'index.html', 'sw.js']);
  assert.equal(deleteSourceMaps(path.join(dir, 'missing')), 0);
});

test('without POSTHOG_CLI_API_KEY: one skip line, no CLI run, and no .map survives', (t) => {
  const dir = fakeDist(t);
  const lines = [];
  const runs = [];
  const result = uploadSourceMaps({ dir, env: {}, exec: (args) => runs.push(args), log: (line) => lines.push(line) });
  assert.deepEqual(result, { uploaded: false, deleted: 3 });
  assert.deepEqual(runs, []);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /uploads skipped/);
  assert.equal(listFiles(dir).filter((file) => file.endsWith('.map')).length, 0);
});

test('with the key: inject then upload on dist for project 631302 on US cloud, then no .map survives', (t) => {
  const dir = fakeDist(t);
  const runs = [];
  const env = { POSTHOG_CLI_API_KEY: 'phx_test', VERCEL_GIT_COMMIT_SHA: 'abc123' };
  const result = uploadSourceMaps({
    dir,
    env,
    exec: (args, cliEnv) => {
      // The maps are still there while the CLI runs.
      assert.equal(listFiles(dir).filter((file) => file.endsWith('.map')).length, 3);
      runs.push({ args, cliEnv });
      return true;
    },
    log: () => {},
  });
  assert.deepEqual(result, { uploaded: true, deleted: 3 });
  assert.deepEqual(runs.map(({ args }) => args.slice(0, 4)), [
    ['--yes', CLI, 'sourcemap', 'inject'],
    ['--yes', CLI, 'sourcemap', 'upload'],
  ]);
  for (const { args, cliEnv } of runs) {
    assert.equal(path.resolve(args[args.indexOf('--directory') + 1]), path.resolve(dir));
    assert.deepEqual(args.slice(args.indexOf('--release-name')), ['--release-name', 'suphian.com', '--release-version', 'abc123']);
    assert.equal(cliEnv.POSTHOG_CLI_API_KEY, 'phx_test');
    assert.equal(cliEnv.POSTHOG_CLI_PROJECT_ID, PROJECT_ID);
    assert.equal(cliEnv.POSTHOG_CLI_HOST, HOST);
  }
  assert.equal(PROJECT_ID, '631302');
  assert.equal(HOST, 'https://us.posthog.com');
  assert.equal(listFiles(dir).filter((file) => file.endsWith('.map')).length, 0);
});

test('a failed inject skips the upload, still deletes every .map, and never throws', (t) => {
  const dir = fakeDist(t);
  const runs = [];
  const lines = [];
  const result = uploadSourceMaps({ dir, env: { POSTHOG_CLI_API_KEY: 'phx_test' }, exec: (args) => runs.push(args) && false, log: (line) => lines.push(line) });
  assert.deepEqual(result, { uploaded: false, deleted: 3 });
  assert.equal(runs.length, 1);
  assert.match(lines.join('\n'), /inject failed/);
  assert.equal(listFiles(dir).filter((file) => file.endsWith('.map')).length, 0);
});

test('the build writes hidden source maps and postbuild runs the upload script', () => {
  assert.match(read('../vite.config.js'), /sourcemap: 'hidden'/);
  const { scripts } = JSON.parse(read('../package.json'));
  assert.equal(scripts.postbuild, 'node scripts/upload-sourcemaps.mjs');
  // e2e:prod goes through npm run build, so it tests the dist that ships, maps deleted.
  assert.match(scripts['e2e:prod'], /^npm run build && /);
});

test('CI passes the upload key to the step that builds', () => {
  const ci = read('../.github/workflows/ci.yml');
  const step = ci.slice(ci.indexOf('- run: npm run e2e:prod'));
  assert.match(step.split('\n      - ')[0], /POSTHOG_CLI_API_KEY: \$\{\{ secrets\.POSTHOG_CLI_API_KEY \}\}/);
});
