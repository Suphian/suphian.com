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

// The scroll band's pick lands a frame after the scroll (rAF, then React).
const settle = (page) => page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 50)))));
const highlighted = (page) => page.locator('.story-button[aria-current="true"] .story-item-name');

// Suphian 2026-09-27: scroll alone picks the chapter; a click or tap opens any
// row, active or not, and opening it doesn't move the highlight.
for (const [index, name] of CHAPTERS.entries()) {
  test(`story chapter ${index + 1} (${name}) opens from the list and closes`, async ({ page }) => {
    const button = page.locator('.story-button').nth(index);
    await button.scrollIntoViewIfNeeded();
    await expect(button).toContainText(name);
    await settle(page);
    const picked = await highlighted(page).textContent();
    if (test.info().project.use.hasTouch) await button.tap();
    else await button.click();
    const detail = page.getByRole('dialog', { name: new RegExp(name) });
    await expect(detail).toBeVisible();
    // A job's summary, or suph.app's project rows (it has no summary in the card).
    await expect(detail.locator('.story-detail-summary, .story-build').first()).not.toBeEmpty();
    await page.keyboard.press('Escape');
    await expect(detail).toBeHidden();
    await expectUnlocked(page);
    await expect(button).toBeFocused();
    await expect(highlighted(page), 'opening a chapter moved the highlight').toHaveText(picked);
  });
}

test('story: hover never moves the highlight or the rail; the active card, Enter and Space open', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile', 'phones use the single-column story (no card rail)');
  const card = page.locator('.story-rail .story-card.is-active');
  await card.scrollIntoViewIfNeeded();
  await settle(page);
  const picked = await highlighted(page).textContent();
  const railIndex = () => page.locator('.story-rail .story-card').evaluateAll((cards) => cards.findIndex((c) => c.classList.contains('is-active')));
  const rail = await railIndex();

  // A mouse sweeping over every row leaves the scroll's pick and its card alone.
  for (const row of await page.locator('.story-button').all()) await row.hover();
  await settle(page);
  await expect(highlighted(page)).toHaveText(picked);
  expect(await railIndex()).toBe(rail);

  // The active card opens the active chapter.
  await card.click();
  let detail = page.getByRole('dialog', { name: new RegExp(picked) });
  await expect(detail).toBeVisible();
  await detail.locator('.story-back').click();
  await expect(detail).toBeHidden();
  await expectUnlocked(page);

  // Keyboard: arrows move the highlight with focus; Space and Enter open the focused row.
  const rows = page.locator('.story-button');
  const at = CHAPTERS.indexOf(picked);
  const next = CHAPTERS[Math.min(at + 1, CHAPTERS.length - 1)];
  await rows.nth(at).focus();
  await page.keyboard.press(at + 1 < CHAPTERS.length ? 'ArrowDown' : 'End');
  await expect(highlighted(page)).toHaveText(next);
  await expect(rows.nth(CHAPTERS.indexOf(next))).toBeFocused();
  for (const key of ['Space', 'Enter']) {
    await page.keyboard.press(key);
    detail = page.getByRole('dialog', { name: new RegExp(next) });
    await expect(detail).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(detail).toBeHidden();
    await expectUnlocked(page);
    await expect(rows.nth(CHAPTERS.indexOf(next))).toBeFocused();
  }
});

// Suphian 2026-09-28: the row says "A new project every month"; the open card is just the
// projects, one line each, newest first, each a link to its page ("Condense… Just keep the
// projects"). The image panel shows the newest build, or the one under a mouse or keyboard focus.
const press = (locator) => (test.info().project.use.hasTouch ? locator.tap() : locator.click());
const suphApp = (page) => page.locator('.story-button').nth(CHAPTERS.indexOf('suph.app'));
const openSuphApp = async (page) => {
  const row = suphApp(page);
  await row.scrollIntoViewIfNeeded();
  await press(row);
  const detail = page.getByRole('dialog', { name: /suph\.app/ });
  await expect(detail).toBeVisible();
  return detail;
};
// The panel's current icon (not the fading copy of the last one).
const panelIcon = (detail) => detail.locator('.story-card--panel .story-card-logo:not([data-leaving])');
const CROWN = '/work/suph-app.svg';
const STAR = '/work/quran-art.svg';

test('suph.app’s card is its projects, one line and one link each; the image follows a mouse, never a finger', async ({ page }) => {
  const row = suphApp(page);
  await row.scrollIntoViewIfNeeded();
  await expect(row.locator('.story-item-name')).toHaveText('suph.app');
  await expect(row.locator('.story-item-meta')).toHaveText('A new project every month');
  const detail = await openSuphApp(page);

  // Just the heading and the projects: no intro, role, place, suph.app link, toggle or summary.
  await expect(detail.locator('.story-detail-summary, .story-detail-role, .story-detail-years, .story-links')).toHaveCount(0);
  await expect(detail).not.toContainText(/A place where|Internet|Visit suph\.app|All projects|Previous|Next/);
  await expect(detail.getByRole('button')).toHaveText([/Back/]);
  await expect(detail.getByText(/3D board game/)).toBeHidden();

  // Both builds, newest first: one link per row, to the build's page, showing its name and month.
  const builds = detail.locator('.story-build');
  await expect(builds).toHaveCount(2);
  await expect(detail.getByRole('link')).toHaveCount(2);
  await expect(builds.locator('.story-build-name')).toHaveText(['The Toga Is Dead', 'Quran Art']);
  await expect(builds.locator('.story-build-month')).toHaveText(['August 2026', 'July 2026']);
  const toga = builds.nth(0).getByRole('link');
  const quran = builds.nth(1).getByRole('link');
  await expect(toga).toHaveAttribute('href', 'https://suph.app/toga');
  await expect(quran).toHaveAttribute('href', 'https://suph.app/quran');
  await expect(toga).toHaveAccessibleName(/The Toga Is Dead.*August 2026/);
  // The summary isn't shown; a screen reader hears it as the link's description.
  await expect(toga).toHaveAccessibleDescription(/^A 3D board game you play in the browser/);
  // The icon token shows each build's mark.
  await expect(builds.locator('.story-build-token img')).toHaveCount(2);
  await expect(builds.nth(1).locator('.story-build-token img')).toHaveAttribute('src', STAR);

  // The panel starts on the newest build.
  const icon = panelIcon(detail);
  await expect(icon).toHaveAttribute('src', CROWN);
  const fine = await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches);
  expect(fine, 'the desktop project has a mouse; the phone does not').toBe(!test.info().project.use.hasTouch);

  if (fine) {
    // A mouse resting on Quran Art shows its star; off the list, the crown is back.
    await builds.nth(1).hover();
    await expect(icon).toHaveAttribute('src', STAR);
    await expect.poll(() => icon.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await builds.nth(0).hover();
    await expect(icon).toHaveAttribute('src', CROWN);
    await builds.nth(1).hover();
    await expect(icon).toHaveAttribute('src', STAR);
    await detail.locator('.story-detail-title').hover();
    await expect(icon).toHaveAttribute('src', CROWN);
    // The crossfade's outgoing copy cleans up after itself.
    await expect(detail.locator('[data-leaving]')).toHaveCount(0);

    // Keyboard focus does the same: Tab to The Toga Is Dead, then Quran Art.
    for (let step = 0; step < 6 && !(await quran.evaluate((el) => el === document.activeElement)); step++) {
      await page.keyboard.press('Tab');
    }
    await expect(quran).toBeFocused();
    await expect(icon).toHaveAttribute('src', STAR);
    await page.keyboard.press('Shift+Tab');
    await expect(toga).toBeFocused();
    await expect(icon).toHaveAttribute('src', CROWN);
  } else {
    // A finger resting on Quran Art (without opening it) leaves the panel on the newest build.
    await builds.nth(1).dispatchEvent('pointerover', { pointerType: 'touch', isPrimary: true, bubbles: true });
    await builds.nth(1).hover();
    await page.waitForTimeout(300);
    await expect(icon).toHaveAttribute('src', CROWN);
  }

  await page.keyboard.press('Escape');
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

// Suphian 2026-09-27: "When I load the page sometimes it takes me all the way to
// the bottom." A load opens at the hero, where the wordmark starts; only a
// /#section link opens somewhere else.
test.describe('a load opens at the top', () => {
  const scrollY = (page) => page.evaluate(() => Math.round(window.scrollY));
  const toBottom = (page) => page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));

  test('a reload from SAY HELLO opens at the top', async ({ page }) => {
    // The browser's own restoration races React's first commit, so it only
    // sometimes lands: reload twice.
    for (let run = 0; run < 2; run += 1) {
      await toBottom(page);
      await expect.poll(() => scrollY(page)).toBeGreaterThan(300);
      await page.waitForTimeout(300); // the offset reaches the history entry
      await page.reload();
      await expect(page.locator('.hero')).toBeAttached();
      await page.waitForTimeout(500); // past the browser's restore
      expect(await scrollY(page)).toBe(0);
    }
  });

  test('a scrolled static profile hands over at the top', async ({ page }) => {
    // Hold the app's entry past the 2 s fallback, so the no-JS profile shows first.
    let release;
    const held = new Promise((resolve) => { release = resolve; });
    await page.route(/\/(assets\/index-[\w-]+\.js|src\/main\.jsx)(\?|$)/, async (route) => {
      await held;
      await route.continue();
    });
    await page.goto('/', { waitUntil: 'commit' });
    const profile = page.locator('.static-profile');
    await expect(profile).toBeVisible({ timeout: 8_000 });
    await toBottom(page);
    expect(await scrollY(page)).toBeGreaterThan(300);
    release();
    await expect(page.locator('.hero')).toBeAttached();
    await expect(profile).toHaveCount(0);
    expect(await scrollY(page)).toBe(0);
  });

  test('a /#work link still opens at that section', async ({ page }) => {
    await page.goto('about:blank');
    await page.goto('/#work');
    await expect(page.locator('.hero')).toBeAttached();
    await expect.poll(() => page.locator('#work').evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBeLessThan(120);
    expect(await scrollY(page)).toBeGreaterThan(300);
  });
});

test.describe('reduced motion', () => {
  // A context option, not a fixture: `test.use({ reducedMotion })` alone is silently ignored
  // by @playwright/test (found 2026-09-28; until then this block ran with full motion).
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
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
  test('suph.app’s panel swaps icons at once, with no fade', async ({ page }) => {
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'reduced motion is on').toBe(true);
    const detail = await openSuphApp(page);
    // Keyboard focus picks the icon on every device (a finger never does).
    const quranLink = detail.locator('.story-build').nth(1).getByRole('link');
    for (let step = 0; step < 6 && !(await quranLink.evaluate((el) => el === document.activeElement)); step++) {
      await page.keyboard.press('Tab');
    }
    await expect(quranLink).toBeFocused();
    await expect(panelIcon(detail)).toHaveAttribute('src', STAR);
    // The moment the new icon shows, nothing is fading and no outgoing copy exists
    // (with motion, a 200ms crossfade would still be running here).
    expect(await detail.locator('.story-card--panel').evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
    await expect(detail.locator('[data-leaving]')).toHaveCount(0);
    expect(await panelIcon(detail).evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
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
