import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from './guard.js';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));

// Fonts and the card logo are what the first paint waits on. These run against the production
// bundle (npm run e2e:prod): the dev server has no hashed fonts and no preload links.
test.beforeEach(async ({ page }, testInfo) => {
  test.skip(!testInfo.config.metadata.preview, 'needs the built bundle (npm run e2e:prod)');
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
});

test('both fonts are preloaded from /assets and resolve as woff2', async ({ page }) => {
  const hrefs = await page.locator('link[rel="preload"][as="font"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(hrefs).toHaveLength(2);
  expect(hrefs.some((href) => /^\/assets\/PPNeueMontreal-Regular-[\w-]+\.woff2$/.test(href))).toBe(true);
  expect(hrefs.some((href) => /^\/assets\/PPNeueMontreal-Semibold-[\w-]+\.woff2$/.test(href))).toBe(true);
  for (const href of hrefs) {
    const response = await page.request.get(href);
    expect(response.status(), href).toBe(200);
    expect(response.headers()['content-type'], href).toMatch(/font\/woff2/);
  }
});

test('the Semibold face is usable', async ({ page }) => {
  await page.evaluate(() => document.fonts.load('600 16px "PP Neue Montreal"'));
  expect(await page.evaluate(() => document.fonts.check('600 16px "PP Neue Montreal"'))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('400 16px "PP Neue Montreal"'))).toBe(true);
});

test('the Abacus logo is served as AVIF', async ({ page }) => {
  const response = await page.request.get('/work/abacus-white.avif');
  expect(response.status()).toBe(200);
  const logo = page.locator('img.story-card-logo[src="/work/abacus-white.png"]').first();
  await expect(logo).toBeAttached();
  await expect.poll(() => logo.evaluate((img) => img.currentSrc)).toMatch(/\/work\/abacus-white\.avif$/);
  // Explicit dimensions, so the image never shifts the layout.
  await expect(logo).toHaveAttribute('width', '748');
  await expect(logo).toHaveAttribute('height', '467');
});

// Source maps are for PostHog only: postbuild (scripts/upload-sourcemaps.mjs)
// deletes them, so none can deploy. Fails the build CI and e2e:prod just made
// if one is left.
test('no source map is left in dist', () => {
  test.skip(Boolean(process.env.E2E_BASE_URL?.trim()), 'checks the dist this run built, not a deployment');
  const maps = readdirSync(DIST, { recursive: true }).map(String).filter((file) => file.endsWith('.map'));
  expect(maps).toEqual([]);
});
