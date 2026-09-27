// The contact-form emails (supabase/functions/notify-contact-submit/emails.ts),
// rendered in Node: its types are erasable, so Node 22.18+ loads the .ts as-is.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  FROM,
  INBOX,
  greetingName,
  isEmailAddress,
  renderOwnerNotification,
  renderThankYou,
} from '../supabase/functions/notify-contact-submit/emails.ts';

// Emoji_Presentation, not Extended_Pictographic: the latter includes ©.
const OFF_BRAND = [/orbit/i, /moon/i, /🌕/u, /Steadily/i, /Principal/i, /Product Manager/i, /\p{Emoji_Presentation}/u];

const owner = (fields = {}) =>
  renderOwnerNotification({
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '',
    message: 'Hi Suphian,\nWe have a PM opening.',
    source: 'Navbar',
    ...fields,
  });

/** Everything the recipient can see: subject, preview line, both parts. */
const visible = ({ subject, preheader, html, text }) => [subject, preheader, html, text].join('\n');

test('the thank-you drops the old space theme, the emoji and the Steadily title', () => {
  for (const name of ['Jane Doe', '']) {
    const email = visible(renderThankYou({ name }));
    for (const pattern of OFF_BRAND) assert.doesNotMatch(email, pattern, `${pattern} with name "${name}"`);
  }
});

test('the thank-you subject, preview line and greeting', () => {
  const withName = renderThankYou({ name: 'Jane Doe' });
  assert.equal(withName.subject, 'Thanks for reaching out');
  assert.match(withName.text, /Looking forward to connecting\./);
  assert.ok(withName.preheader.length > 0 && withName.preheader.length <= 90);
  assert.match(withName.html, /Thanks for reaching out, Jane<span[^>]*>\.<\/span><\/h1>/);
  assert.match(withName.text, /^Thanks for reaching out, Jane\.\n/);

  const noName = renderThankYou({ name: '' });
  assert.match(noName.html, /Thanks for reaching out<span[^>]*>\.<\/span><\/h1>/);
  assert.match(noName.text, /^Thanks for reaching out\.\n/);
});

test('the thank-you is signed "Suphian" and nothing else', () => {
  const { html, text } = renderThankYou({ name: 'Jane' });
  assert.match(html, /font-weight:600;">Suphian<\/td><\/tr>\n<tr><td[^>]*><table role="presentation"/);
  assert.match(text, /\n\nSuphian\nhttps:\/\/suphian\.com\n\n/);
});

test('both emails hide a preheader and title the page with the subject', () => {
  for (const email of [renderThankYou({ name: 'Jane' }), owner()]) {
    assert.match(email.html, /<div style="display:none;[^"]*mso-hide:all;[^"]*">/);
    assert.ok(email.html.includes(`<title>${email.subject}</title>`));
    assert.ok(email.html.includes(email.preheader));
  }
});

test('plain-text parts carry no markup or entities', () => {
  for (const { text } of [renderThankYou({ name: 'Jane' }), owner({ phone: '+1 555 123 4567' })]) {
    assert.doesNotMatch(text, /<[a-z/!]|&[a-z]+;|&#\d+;/i);
  }
});

test('names are escaped in the HTML and kept as typed in subjects and text', () => {
  const name = '<script>alert(1)</script> & "Co"';
  const email = owner({ name, message: '<b>bold</b> & more' });
  assert.doesNotMatch(email.html, /<script>|<b>bold/);
  assert.ok(email.html.includes('New message from &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;Co&quot;'));
  assert.ok(email.html.includes('&lt;b&gt;bold&lt;/b&gt; &amp; more'));
  assert.equal(email.subject, `New message from ${name}`);
  assert.ok(email.text.includes('<b>bold</b> & more'));

  const thanks = renderThankYou({ name: '<img src=x onerror=alert(1)>' });
  assert.doesNotMatch(thanks.html, /<img src=x/);
  assert.match(thanks.html, /Thanks for reaching out<span/);
});

test('the thank-you greets only a plain first name', () => {
  assert.equal(greetingName('  Jane   Doe '), 'Jane');
  assert.equal(greetingName('Jean-Luc Picard'), 'Jean-Luc');
  assert.equal(greetingName('O’Brien'), 'O’Brien');
  assert.equal(greetingName('José'), 'José');
  assert.equal(greetingName('www.cheap-pills.example'), '');
  assert.equal(greetingName('http://spam.example'), '');
  assert.equal(greetingName('Jane<b>'), '');
  assert.equal(greetingName(''), '');
  assert.match(renderThankYou({ name: 'Visit spam.example now' }).subject, /^Thanks for reaching out$/);
});

test('the owner subject names the sender, then falls back to the address', () => {
  assert.equal(owner().subject, 'New message from Jane Doe');
  assert.equal(owner({ name: 'Jane\r\nBcc: x@example.com' }).subject, 'New message from Jane Bcc: x@example.com');
  assert.equal(owner({ name: '' }).subject, 'New message from jane@example.com');
  assert.equal(owner({ name: '', email: 'nope' }).subject, 'New message from suphian.com');
});

test('the owner email is from the site, previews the message and offers a reply', () => {
  assert.equal(FROM.owner, `suphian.com <${INBOX}>`);
  assert.equal(FROM.thankYou, `Suphian Tweel <${INBOX}>`);
  const email = owner({ message: 'Hi Suphian,\r\nWe have a PM opening that fits your background. '.repeat(4) });
  assert.ok(email.preheader.startsWith('Hi Suphian, We have a PM opening'));
  assert.ok(email.preheader.length <= 120 && email.preheader.endsWith('…'));
  assert.ok(email.html.includes('href="mailto:jane@example.com"'));
  assert.ok(email.html.includes('Reply to Jane'));
  assert.ok(email.text.includes('Hi Suphian,\nWe have a PM opening'));
  assert.ok(email.text.includes('Email: jane@example.com\nOpened from: Navbar'));
  assert.ok(email.text.includes('Reply to this email to write back to Jane.'));
  assert.ok(email.html.includes('Hi Suphian,<br/>We have a PM opening'));
});

test('an address that is not an address gets no link and no reply line', () => {
  const email = owner({ email: 'jane at example' });
  assert.doesNotMatch(email.html, /mailto:/);
  assert.ok(email.html.includes('jane at example'));
  assert.doesNotMatch(email.text, /Reply to this email/);
});

test('isEmailAddress accepts real addresses and rejects header tricks', () => {
  for (const ok of ['jane@example.com', "o'brien+site@mail.example.co.uk", 'a.b-c@x-y.io']) assert.ok(isEmailAddress(ok), ok);
  for (const bad of ['', 'jane', 'jane@example', 'jane@@example.com', 'jane@example.com\nBcc: x@y.com', 'Jane <jane@example.com>', 'jane @example.com', `${'a'.repeat(250)}@example.com`]) {
    assert.ok(!isEmailAddress(bad), JSON.stringify(bad));
  }
});

test('the function sends both parts, from the shared senders, with no old copy left', async () => {
  const src = await readFile(new URL('../supabase/functions/notify-contact-submit/index.ts', import.meta.url), 'utf8');
  assert.match(src, /from "\.\/emails\.ts"/);
  assert.match(src, /text: ownerEmail\.text/);
  assert.match(src, /text: thankYou\.text/);
  assert.match(src, /reply_to: email \|\| undefined/);
  for (const old of ['🌕', 'orbit', 'Contact Notification', 'Contact Form Submission', 'Steadily']) {
    assert.ok(!src.includes(old), old);
  }
});
