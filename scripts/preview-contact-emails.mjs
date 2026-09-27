// Renders the contact-form emails to local files, without Deno and without
// sending anything: HTML, plain text, a summary of the headers, and PNGs at
// phone (390px) and desktop (640px) widths.
//
//   node scripts/preview-contact-emails.mjs [out-dir] [--no-png]
//
// out-dir defaults to <os tmpdir>/suphian-email-preview. Screenshots use the
// repo's headless Playwright Chromium on the local files; the logo loads from
// suphian.com, so offline runs show its alt text instead.
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  FROM,
  INBOX,
  isEmailAddress,
  renderOwnerNotification,
  renderThankYou,
} from '../supabase/functions/notify-contact-submit/emails.ts';

const args = process.argv.slice(2);
const png = !args.includes('--no-png');
const outDir = resolve(args.find((arg) => !arg.startsWith('--')) ?? join(tmpdir(), 'suphian-email-preview'));

const jane = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1 555 123 4567',
  message: 'Hi Suphian,\nWe have a PM opening that fits your background. Open to a chat?\n\nJane',
  source: 'Navbar',
};
const anonymous = { ...jane, name: '', phone: '', message: 'Loved the site. Is the SUPH lettering hand-drawn?' };

// The same from/to/reply_to the function sends with.
const owner = (fields) => ({ from: FROM.owner, to: INBOX, replyTo: isEmailAddress(fields.email) ? fields.email : '', ...renderOwnerNotification(fields) });
const thankYou = (fields) => ({ from: FROM.thankYou, to: fields.email, replyTo: INBOX, ...renderThankYou(fields) });

const emails = {
  'thank-you-with-name': thankYou(jane),
  'thank-you-without-name': thankYou(anonymous),
  'owner-with-name': owner(jane),
  'owner-without-name': owner(anonymous),
};

await mkdir(outDir, { recursive: true });
const summary = [];
for (const [slug, email] of Object.entries(emails)) {
  await writeFile(join(outDir, `${slug}.html`), email.html);
  await writeFile(join(outDir, `${slug}.txt`), `${email.text}\n`);
  summary.push(
    `${slug}\n  From:     ${email.from}\n  To:       ${email.to}\n  Reply-To: ${email.replyTo || '(none)'}\n  Subject:  ${email.subject}\n  Preview:  ${email.preheader}`,
  );
}
await writeFile(join(outDir, 'summary.txt'), `${summary.join('\n\n')}\n`);

if (png) {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  try {
    for (const width of [390, 640]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      for (const slug of Object.keys(emails)) {
        await page.goto(pathToFileURL(join(outDir, `${slug}.html`)).href, { waitUntil: 'load' });
        await page.screenshot({ path: join(outDir, `${slug}-${width}.png`), fullPage: true });
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

console.log(`Wrote ${Object.keys(emails).length} emails${png ? ' and screenshots' : ''} to ${outDir}`);
