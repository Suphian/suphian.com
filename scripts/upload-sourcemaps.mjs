// postbuild (package.json): source maps for PostHog Error Tracking. vite.config.js
// writes hidden source maps into dist/. With POSTHOG_CLI_API_KEY set (Vercel's
// environment only: its builds are the ones that deploy), posthog-cli injects a
// chunk id into each bundled chunk and uploads its map, so PostHog shows
// exceptions with the original source. Without it (CI, local builds), uploads
// are skipped and stack traces stay minified. Either way every .map is deleted
// afterwards: none is ever deployed. vercel.json pins buildCommand to npm run
// build so this always runs there, and e2e:prod fails if a .map is left.
//
// The key is a personal API key with error_tracking:write, organization:read
// and project:read (docs/launch.md). It never goes in git.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Pinned, and fetched only when uploading, so builds without the key download nothing.
export const CLI = '@posthog/cli@0.18.9';
// The Suph.ai org's project (analytics.js POSTHOG_KEY), US cloud.
export const PROJECT_ID = '631302';
export const HOST = 'https://us.posthog.com';
export const RELEASE_NAME = 'suphian.com';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Deletes every .map file under dir, however deep. Returns how many. */
export function deleteSourceMaps(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) count += deleteSourceMaps(file);
    else if (entry.name.endsWith('.map')) {
      fs.rmSync(file);
      count += 1;
    }
  }
  return count;
}

/** posthog-cli sourcemap inject, then upload, on dir: the npx argument lists. */
export function cliCommands(dir, env) {
  // The deployed commit, so PostHog groups exceptions by release. Without one,
  // posthog-cli derives the version from git.
  const version = env.VERCEL_GIT_COMMIT_SHA;
  const release = ['--release-name', RELEASE_NAME, ...(version ? ['--release-version', version] : [])];
  return ['inject', 'upload'].map((step) => ['--yes', CLI, 'sourcemap', step, '--directory', dir, ...release]);
}

function npx(args, env) {
  const result = spawnSync('npx', args, {
    cwd: root,
    env,
    stdio: ['ignore', 'inherit', 'inherit'],
    // npx is npx.cmd on Windows, which only runs through a shell. The arguments
    // are fixed strings and a path relative to the repo, nothing from outside.
    shell: process.platform === 'win32',
    timeout: 5 * 60 * 1000,
  });
  return result.status === 0;
}

/**
 * Uploads (with the key) and then deletes dist's source maps. A failed upload
 * is reported but never fails the build: the site deploys, with minified stack
 * traces for that build. exec runs one npx argument list and returns whether
 * it succeeded; the tests replace it.
 */
export function uploadSourceMaps({ dir = path.join(root, 'dist'), env = process.env, exec = npx, log = console.log } = {}) {
  const tag = 'upload-sourcemaps:';
  if (!env.POSTHOG_CLI_API_KEY) {
    const deleted = deleteSourceMaps(dir);
    log(`${tag} POSTHOG_CLI_API_KEY is not set, so source map uploads skipped (stack traces stay minified); deleted ${deleted} .map files from dist.`);
    return { uploaded: false, deleted };
  }
  const cliEnv = { ...env, POSTHOG_CLI_PROJECT_ID: PROJECT_ID, POSTHOG_CLI_HOST: HOST };
  let uploaded = true;
  for (const args of cliCommands(path.relative(root, dir) || '.', env)) {
    if (!exec(args, cliEnv)) {
      uploaded = false;
      log(`${tag} posthog-cli sourcemap ${args[3]} failed; this build's stack traces stay minified.`);
      break;
    }
  }
  const deleted = deleteSourceMaps(dir);
  log(`${tag} ${uploaded ? 'uploaded source maps to PostHog project ' + PROJECT_ID : 'upload incomplete'}; deleted ${deleted} .map files from dist.`);
  return { uploaded, deleted };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) uploadSourceMaps();
