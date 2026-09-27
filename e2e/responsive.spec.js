import { mkdirSync } from 'node:fs';
import { expect, expectUnlocked, openContact, test } from './guard.js';

// Phone / tablet / desktop matrix (Suphian: "make sure it is phone-friendly,
// tablet-friendly"). Each size sets its own viewport, so run it once (desktop project).
const SIZES = [
  { name: 'phone-360', width: 360, height: 740, touch: true },
  { name: 'phone-se-375', width: 375, height: 667, touch: true },
  { name: 'phone-390', width: 390, height: 844, touch: true },
  { name: 'phone-430', width: 430, height: 932, touch: true },
  { name: 'phone-landscape-844', width: 844, height: 390, touch: true },
  { name: 'tablet-768', width: 768, height: 1024, touch: true },
  { name: 'tablet-820', width: 820, height: 1180, touch: true },
  { name: 'tablet-landscape-1024', width: 1024, height: 768, touch: true },
  { name: 'tablet-landscape-1180', width: 1180, height: 820, touch: true },
  { name: 'laptop-1280', width: 1280, height: 800, touch: false },
  { name: 'desktop-1920', width: 1920, height: 1080, touch: false },
];
const SHOTS = new URL('../qa/responsive/', import.meta.url);
mkdirSync(SHOTS, { recursive: true });

const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

for (const size of SIZES) {
  test.describe(size.name, () => {
    test.use({ viewport: { width: size.width, height: size.height }, hasTouch: size.touch, isMobile: size.touch && size.width < 1000 });

    test(`${size.name}: fits, docks cleanly, targets are tappable, overlays fit`, async ({ page }) => {
      test.skip(test.info().project.name !== 'desktop', 'the matrix sets its own viewports; run once');
      const shot = (label) => page.screenshot({ path: new URL(`${size.name}-${label}.png`, SHOTS).pathname.replace(/^\/([A-Za-z]:)/, '$1') });
      await page.goto('/');
      await expect(page.locator('main')).toBeVisible();
      await shot('1-top');

      // No sideways scroll anywhere down the page.
      const total = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
      for (const f of [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1]) {
        await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * f));
        await page.waitForTimeout(120);
        expect(await overflowX(page), `horizontal overflow at ${Math.round(f * 100)}% scroll`).toBeLessThanOrEqual(1);
      }

      // Docked: SUPH sits in the header without colliding with the nav.
      await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.6));
      await page.waitForTimeout(1600);
      const home = page.locator('a.home-link');
      await expect(home).toBeVisible();
      const [homeBox, navBox] = await Promise.all([home.boundingBox(), page.locator('.edition').boundingBox()]);
      expect(homeBox.x + homeBox.width, 'docked SUPH inside the viewport').toBeLessThanOrEqual(size.width + 1);
      const overlap = navBox.x < homeBox.x + homeBox.width && homeBox.x < navBox.x + navBox.width
        && navBox.y < homeBox.y + homeBox.height && homeBox.y < navBox.y + navBox.height;
      expect(overlap, 'the edition overlaps the docked SUPH').toBe(false);
      await shot('2-docked');

      // Tap targets: every visible nav / story / footer / SAY HELLO control is at least 44px tall.
      const small = await page.evaluate(() => [...document.querySelectorAll('header a, header button, .story-button, footer a, footer button, .say-hello, a.home-link')]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; })
        .map((el) => { const r = el.getBoundingClientRect(); return { what: (el.getAttribute('aria-label') || el.textContent || el.className).trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) }; })
        .filter((t) => t.h < 44 || t.w < 24));
      expect(small, 'tap targets smaller than 44px tall (or 24px wide)').toEqual([]);

      // Contact sheet fits the screen.
      await openContact(page);
      const sheet = page.getByRole('dialog', { name: 'Contact' });
      await expect(sheet).toBeVisible();
      await page.waitForTimeout(600);
      const sheetBox = await sheet.boundingBox();
      expect(sheetBox.x, 'contact panel starts on screen').toBeGreaterThanOrEqual(-1);
      expect(sheetBox.x + sheetBox.width, 'contact panel ends on screen').toBeLessThanOrEqual(size.width + 1);
      expect(await sheet.evaluate((el) => el.scrollWidth - el.clientWidth), 'contact panel scrolls sideways').toBeLessThanOrEqual(1);
      await shot('3-contact');
      await page.keyboard.press('Escape');
      await expect(sheet).toBeHidden();
      await expectUnlocked(page);

      // A story chapter's open view fits the screen. Touch screens tap it open.
      const chapter = page.locator('.story-button').filter({ hasText: 'YouTube' });
      await chapter.scrollIntoViewIfNeeded();
      if (size.touch) await chapter.tap();
      else await chapter.click();
      const detail = page.getByRole('dialog', { name: /YouTube/ });
      await expect(detail).toBeVisible();
      await page.waitForTimeout(900);
      expect(await overflowX(page), 'horizontal overflow with a chapter open').toBeLessThanOrEqual(1);
      expect(await detail.evaluate((el) => el.scrollWidth - el.clientWidth), 'chapter view scrolls sideways').toBeLessThanOrEqual(1);
      await shot('4-chapter');
      await page.keyboard.press('Escape');
      await expect(detail).toBeHidden();
      if (size.touch) {
        // Suphian 2026-09-27: after the tap, the row looks like any other row at its
        // distance from the highlight: no sticky hover colour (iOS keeps :hover).
        await page.waitForTimeout(400);
        const [tapped, twin] = await chapter.evaluate((el) => {
          const item = el.closest('.story-item');
          const other = [...document.querySelectorAll('.story-item')].find((li) => li !== item && li.dataset.distance === item.dataset.distance);
          return [getComputedStyle(el).color, other ? getComputedStyle(other.querySelector('.story-button')).color : null];
        });
        if (twin) expect(tapped, 'the tapped row keeps a hover colour').toBe(twin);
      }

      // SAY HELLO sits on screen at the bottom.
      const hello = page.getByRole('button', { name: 'Say hello: open the contact form' });
      await hello.scrollIntoViewIfNeeded();
      const helloBox = await hello.boundingBox();
      expect(helloBox.x + helloBox.width, 'SAY HELLO inside the viewport').toBeLessThanOrEqual(size.width + 1);
      await page.waitForTimeout(1600);
      await shot('5-say-hello');
    });
  });
}
