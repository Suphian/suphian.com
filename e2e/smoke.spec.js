import { contactDialog, expect, expectUnlocked, openContact, test } from './guard.js';

const SAY_HELLO = 'Say hello: open the contact form';
const CHAPTERS = ['Steadily', 'YouTube', 'Google', 'Huge', 'Abacus Labs', 'suph.app'];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
});

test('home renders without errors', async ({ page }) => {
  await expect(page.locator('svg.lettering-layer')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});

test('the contact sheet opens; Esc and Close both close it; it reopens', async ({ page }) => {
  await openContact(page);
  const dialog = await contactDialog(page);
  await expect(dialog.getByLabel(/^Name/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expectUnlocked(page);

  await openContact(page);
  await contactDialog(page);
  await page.getByRole('dialog', { name: 'Contact' }).getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog', { name: 'Contact' })).toBeHidden();
  await expectUnlocked(page);
});

test('SAY HELLO opens the sheet (click)', async ({ page }) => {
  const hello = page.getByRole('button', { name: SAY_HELLO });
  await hello.scrollIntoViewIfNeeded();
  await hello.click();
  const dialog = await contactDialog(page);
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  await expectUnlocked(page);
});

test('SAY HELLO opens the sheet (keyboard Enter)', async ({ page }) => {
  const hello = page.getByRole('button', { name: SAY_HELLO });
  await hello.scrollIntoViewIfNeeded();
  await hello.focus();
  await page.keyboard.press('Enter');
  await contactDialog(page);
});

test('contact form: validation, then a send that never reaches real Supabase', async ({ page, guard }) => {
  await openContact(page);
  const dialog = await contactDialog(page);

  await dialog.getByRole('button', { name: 'Send message' }).click();
  await expect(dialog.locator('.field-error').first()).toBeVisible();

  await expect(dialog.locator('.chip')).toHaveCount(0); // no prefill chips

  await dialog.getByLabel(/^Name/).fill('Playwright Smoke');
  await dialog.getByLabel(/^Email/).fill('smoke@example.com');
  await dialog.getByLabel(/^Message/).fill('Automated smoke test. Please ignore this message.');
  await dialog.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Message sent')).toBeVisible();
  await expect(dialog).toBeHidden();
  await expectUnlocked(page);

  // Dev is a dry run (no calls at all); a production build only ever hits the stubs.
  for (const url of guard.supabaseCalls) expect(url).toMatch(/check_rate_limit|contact_submissions|notify-contact-submit/);
});

for (const [index, name] of CHAPTERS.entries()) {
  test(`story chapter ${index + 1} (${name}) opens from the list and closes`, async ({ page }) => {
    const button = page.locator('.story-button').nth(index);
    await button.scrollIntoViewIfNeeded();
    await expect(button).toContainText(name);
    await button.click();
    const detail = page.getByRole('dialog', { name: new RegExp(name) });
    await expect(detail).toBeVisible();
    await expect(detail.locator('.story-detail-summary')).not.toBeEmpty();
    await page.keyboard.press('Escape');
    await expect(detail).toBeHidden();
    await expectUnlocked(page);
  });
}

test('story: the active card opens its chapter; Back closes it', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile', 'phones use the single-column story (no card rail)');
  const card = page.locator('.story-rail .story-card.is-active');
  await card.scrollIntoViewIfNeeded();
  await card.click();
  const detail = page.getByRole('dialog');
  await expect(detail).toBeVisible();
  await detail.locator('.story-back').click();
  await expect(detail).toBeHidden();
  await expectUnlocked(page);
});

test('scrolling docks SUPH; the docked SUPH scrolls back to the top', async ({ page }) => {
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0); // no header nav
  await page.locator('#work').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  // The docked SUPH (the header's red dot shares its label and destination).
  const home = page.locator('a.home-link');
  await expect(home).toBeVisible();
  await home.click();
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBeLessThan(40);
});

test('removed pages redirect home (no dead ends)', async ({ page }) => {
  for (const path of ['/podcast', '/nope', '/resume']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('svg.lettering-layer')).toBeVisible();
  }
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('contact sheet and a story chapter still work', async ({ page }) => {
    await openContact(page);
    await contactDialog(page);
    await page.keyboard.press('Escape');
    await expectUnlocked(page);
    const button = page.locator('.story-button').nth(CHAPTERS.indexOf('YouTube'));
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await expect(page.getByRole('dialog', { name: /YouTube/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await expectUnlocked(page);
  });
});

test.describe('SAY HELLO on touch (option a)', () => {
  const letterTransforms = (page) => page.locator('.say-hello [data-letter]').evaluateAll((els) => els.map((el) => el.getAttribute('transform')));
  const touch = (page, type, x, y) => page.locator('.say-hello').dispatchEvent(type, { pointerType: 'touch', isPrimary: true, pointerId: 7, clientX: x, clientY: y, bubbles: true });

  test('a finger that starts a scroll never squishes it', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile', 'touch only');
    const hello = page.locator('.say-hello');
    await hello.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000); // let the entrance settle
    const rest = await letterTransforms(page);
    const box = await hello.boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await touch(page, 'pointerdown', x, y);
    await touch(page, 'pointermove', x, y - 30); // travelling: a scroll
    await touch(page, 'pointercancel', x, y - 30);
    await page.waitForTimeout(300);
    expect(await letterTransforms(page)).toEqual(rest);
  });
});
