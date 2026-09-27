import { readFileSync, writeFileSync } from 'node:fs';
import { contactDialog, expect, openContact, test } from './guard.js';

// Regression for the "useUI must be used within UIProvider" crash: in dev, a hot
// reload that bumps UIProvider.jsx's ?t= timestamp used to give the lazily loaded
// contact sheet a second React context. Reproduce that exact sequence and check the
// sheet still opens. Dev server only (npm run e2e:hmr); edits and restores the file.
const FILE = new URL('../src/components/UIProvider.jsx', import.meta.url);

test('contact sheet opens after UIProvider.jsx hot-reloads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  const original = readFileSync(FILE, 'utf8');
  try {
    writeFileSync(FILE, `${original}\n// e2e hot-reload probe\n`);
    await page.waitForTimeout(1500);
  } finally {
    writeFileSync(FILE, original);
  }
  await page.waitForTimeout(1500);
  await openContact(page);
  await contactDialog(page);
});
