import { expect, test as base } from '@playwright/test';

// Every test runs under a guard: any uncaught error, console error, error-boundary
// screen, or real request to Supabase fails it. Supabase is stubbed so a production
// build (where the contact form is live) never writes a row or sends an email.
export const test = base.extend({
  guard: [async ({ page }, use) => {
    const problems = [];
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(`console.error: ${message.text()}`);
    });
    const supabaseCalls = [];
    await page.route(/supabase\.co/, async (route) => {
      const url = route.request().url();
      supabaseCalls.push(url);
      if (url.includes('/rpc/check_rate_limit')) return route.fulfill({ status: 200, contentType: 'application/json', body: 'true' });
      if (url.includes('/rest/v1/contact_submissions')) return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
      if (url.includes('/functions/v1/notify-contact-submit')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await use({ problems, supabaseCalls });
    await expect(page.getByText('Something went wrong', { exact: false }), 'error screen shown').toHaveCount(0);
    expect(problems, 'page errors / console errors').toEqual([]);
  }, { auto: true }],
});

export { expect };

/** Suphian dropped the header nav: SAY HELLO is the way into the contact sheet. */
export async function openContact(page) {
  const hello = page.getByRole('button', { name: 'Say hello: open the contact form' });
  await hello.scrollIntoViewIfNeeded();
  await hello.click();
}

/** Open the contact sheet and return its dialog. */
export async function contactDialog(page) {
  const dialog = page.getByRole('dialog', { name: 'Contact' });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** The page is scrollable again (no dialog lock left behind). */
export async function expectUnlocked(page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('is-locked'))).toBe(false);
  await expect.poll(() => page.evaluate(() => document.getElementById('root')?.inert ?? false)).toBe(false);
}
