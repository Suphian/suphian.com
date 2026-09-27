import { expect, test as base } from '@playwright/test';

// Every test runs under a guard: any uncaught error, console error, error-boundary
// screen, or real request to Supabase fails it. Supabase is stubbed so a production
// build (where the contact form is live) never writes a row or sends an email.
export const test = base.extend({
  guard: [async ({ page }, use, testInfo) => {
    const problems = [];
    let previewToolbarCspErrors = 0;
    // Protected Vercel previews inject a feedback toolbar outside the app.
    // Keep production CSP unchanged; opt in only for this exact blocked script.
    const ignorePreviewToolbar = process.env.E2E_IGNORE_VERCEL_TOOLBAR_CSP === '1'
      && /^https:\/\/[^/]+\.vercel\.app(?:\/|$)/.test(process.env.E2E_BASE_URL || '');
    const toolbarCspError = /^Loading the script 'https:\/\/vercel\.live\/_next-live\/feedback\/feedback\.js' violates the following Content Security Policy directive: "script-src [^"\r\n]*"\. Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback\. The action has been blocked\.$/;
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      if (ignorePreviewToolbar && toolbarCspError.test(message.text())) {
        previewToolbarCspErrors += 1;
        return;
      }
      problems.push(`console.error: ${message.text()}`);
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
    if (ignorePreviewToolbar) {
      await testInfo.attach('preview-toolbar-csp.json', {
        body: JSON.stringify({ ignoredPreviewToolbarCspErrors: previewToolbarCspErrors }),
        contentType: 'application/json',
      });
    }
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
