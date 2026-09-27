// The two contact-form emails in the site's brand: red, near-black and white
// (DESIGN-BRIEF.md and the :root tokens in src/style.css), in its voice:
// plain-spoken and personal. Email-safe HTML: tables, inline styles, a 600px
// column, and a bgcolor on every cell that holds text, so a client that drops
// or inverts a background never leaves white text on white. Every email also
// has a plain-text part and a hidden preheader (the inbox preview line).
//
// Fields come in raw, as the visitor typed them, and are escaped here.
//
// No imports, no Deno APIs and only erasable TypeScript (no enums, namespaces
// or parameter properties), so Node 22.18+ loads this file as-is:
// tests/contact-emails.test.mjs and scripts/preview-contact-emails.mjs render
// the same emails the function sends.

export const BRAND = {
  red: "#FB2726", // the artwork red
  black: "#080808",
  surface: "#111111", // raised near-black
  white: "#FFFFFF",
  gray: "#ADADAD", // secondary text: 8.9:1 on black
  grayDim: "#858585", // tertiary text: 5.4:1 on black
  line: "#262626", // hairline: white at 12% over black, flattened for Outlook
  // PP Neue Montreal is never embedded or linked: email clients load web fonts
  // unreliably and its license is personal use only. It shows where installed.
  font: "'PP Neue Montreal','Helvetica Neue',Helvetica,Arial,sans-serif",
  site: "https://suphian.com",
  // The SUPH mark as a PNG (Gmail blocks SVG): 180x180, red on #080808.
  logo: "https://suphian.com/icons/apple-touch-icon.png",
  linkedin: "https://www.linkedin.com/in/suphian/",
  github: "https://github.com/Suphian",
};

/** The inbox the form writes to. Both emails are sent from it. */
export const INBOX = "hello@suphian.com";

/** Sender names. The notification is from the site, the thank-you from him. */
export const FROM = {
  owner: `suphian.com <${INBOX}>`,
  thankYou: `Suphian Tweel <${INBOX}>`,
};

/** The thank-you's words, shared by its HTML and plain-text parts. */
const THANK_YOU = {
  subject: "Thanks for your message",
  preheader: "It came through. I read every one myself and reply personally.",
  heading: (firstName: string) => `Thanks for writing${firstName ? `, ${firstName}` : ""}`,
  body: [
    "Your message came through. I read every one myself and reply personally.",
    "If you think of anything to add, just reply to this email.",
  ],
  signOff: "Suphian",
  // For anyone whose address was typed in by someone else.
  reason: "Sent because this address was entered in the contact form on suphian.com.",
};

export interface ContactFields {
  name: string;
  email: string; // as typed; only a well-formed address becomes a link
  phone: string; // "" when not given
  message: string; // as typed, newlines included
  source: string; // what opened the form, e.g. "Navbar"
}

export interface RenderedEmail {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

export function escapeHTML(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** One line of text: control characters and runs of whitespace become one space. */
function oneLine(str: string): string {
  return str.replace(/[\s\u0000-\u001f\u007f]+/g, " ").trim();
}

// The pattern browsers use for <input type="email">, plus a dot in the domain.
const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

/** True for an address worth replying to: well formed and at most 254 characters. */
export function isEmailAddress(str: string): boolean {
  return str.length <= 254 && EMAIL_PATTERN.test(str);
}

/**
 * The first name, for a greeting. Only a plain word (letters, apostrophes,
 * hyphens, up to 24 characters) is used, so the form can't put a link or a
 * slogan into an email sent to someone else's address. Otherwise "".
 */
export function greetingName(name: string): string {
  const first = oneLine(name).split(" ")[0];
  return /^\p{L}[\p{L}\p{M}'’-]{0,23}$/u.test(first) ? first : "";
}

/** Font, size, line height and color for a run of text. */
function textStyle(size: number, lineHeight: number, color: string): string {
  return `font-family:${BRAND.font};font-size:${size}px;line-height:${lineHeight}px;mso-line-height-rule:exactly;color:${color};`;
}

/** One layout row. The cell repeats the canvas color (see the note above). */
function emailRow(content: string, padding: string, style = ""): string {
  return `<tr><td bgcolor="${BRAND.black}" style="padding:${padding};background-color:${BRAND.black};${style}">${content}</td></tr>`;
}

/** The SUPH mark, linked to the site. With images off, the alt text shows in red. */
function logoMark(size: number): string {
  return `<a href="${BRAND.site}" target="_blank" style="text-decoration:none;"><img src="${BRAND.logo}" width="${size}" height="${size}" alt="Suphian Tweel" style="display:block;width:${size}px;height:${size}px;border:0;outline:none;text-decoration:none;${textStyle(16, 20, BRAND.red)}font-weight:600;"></a>`;
}

/** Big heading closed by a red period, like the site's section headings. */
function heading(text: string): string {
  return `<h1 style="margin:0;${textStyle(32, 38, BRAND.white)}font-weight:600;letter-spacing:-0.5px;">${text}<span style="color:${BRAND.red};">.</span></h1>`;
}

/**
 * Bulletproof button: a table cell with a link. White fill, near-black text
 * (20:1); white text on the red would be 3.9:1 and fail AA. Square and 56px
 * tall like the site's buttons. Outlook ignores padding on links, so it gets
 * the same padding on the cell through mso-padding-alt.
 */
function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td bgcolor="${BRAND.white}" style="background-color:${BRAND.white};mso-padding-alt:16px 24px;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:16px 24px;${textStyle(18, 24, BRAND.black)}font-weight:600;text-decoration:none;">${label}&nbsp;&nbsp;<span aria-hidden="true">&rarr;</span></a>
    </td>
  </tr>
</table>`;
}

/** Footer below a hairline, like the site's footer. */
function footerRow(content: string): string {
  return emailRow(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td bgcolor="${BRAND.black}" style="padding:24px 0 0 0;border-top:1px solid ${BRAND.line};background-color:${BRAND.black};${textStyle(16, 24, BRAND.grayDim)}">${content}</td>
  </tr>
</table>`,
    "48px 0 0 0",
  );
}

/**
 * The inbox preview line. Hidden everywhere it renders; the trailing
 * zero-width filler keeps clients from appending body text after it.
 */
function preheaderBlock(text: string): string {
  return `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${BRAND.black};">${escapeHTML(text)}${"&#847;&zwnj;&nbsp;".repeat(60)}</div>`;
}

/** The shell both emails share: a full-bleed near-black canvas and a 600px column. */
function emailDocument(title: string, preheader: string, rows: string[]): string {
  const { black } = BRAND;
  const safeTitle = escapeHTML(title);
  return `<!DOCTYPE html>
<html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${safeTitle}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>body, table, td, h1, p, a, span { font-family: Arial, Helvetica, sans-serif !important; }</style>
<![endif]-->
<style>
  :root { color-scheme: dark light; supported-color-schemes: dark light; }
</style>
<style>
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
</style>
</head>
<body bgcolor="${black}" style="margin:0;padding:0;background-color:${black};-webkit-text-size-adjust:100%;">
<div role="article" aria-roledescription="email" aria-label="${safeTitle}" lang="en" dir="ltr">
${preheaderBlock(preheader)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${black}" style="background-color:${black};">
  <tr>
    <td align="center" bgcolor="${black}" style="padding:48px 20px;background-color:${black};">
      <!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${black}" style="max-width:600px;margin:0 auto;background-color:${black};">
${rows.filter(Boolean).join("\n")}
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</div>
</body>
</html>`;
}

/** mailto: for a checked address; the few characters that mean something in a URL are encoded. */
function mailto(email: string): string {
  return `mailto:${email.replace(/[%?#&]/g, (c) => encodeURIComponent(c))}`;
}

/** To Suphian: who wrote, what they said, how to reach them, what opened the form. */
export function renderOwnerNotification(f: ContactFields): RenderedEmail {
  const { black, surface, white, gray, line, site } = BRAND;
  const name = oneLine(f.name);
  const email = oneLine(f.email);
  const phone = oneLine(f.phone);
  const source = oneLine(f.source) || "Unknown";
  const message = f.message.replace(/\r\n?/g, "\n").trim();
  const canReply = isEmailAddress(email);
  const firstName = greetingName(name);

  // Subjects are plain text, so the name goes in as typed (on one line).
  const subject = `New message from ${name || (canReply ? email : "") || "suphian.com"}`;
  const excerpt = oneLine(message);
  const preheader = !excerpt ? "No message included." : excerpt.length > 120 ? `${excerpt.slice(0, 119).trimEnd()}…` : excerpt;

  const link = (href: string, label: string) =>
    `<a href="${escapeHTML(href)}" style="color:${white};text-decoration:underline;">${escapeHTML(label)}</a>`;
  // tel: gets digits and "+" only. A phone with anything else in it is shown
  // as plain text instead.
  const dial = /^[+\d\s().-]+$/.test(phone) ? phone.replace(/[^+\d]/g, "") : "";
  const details: [string, string, string][] = [
    ["Email", email || "Not given", canReply ? link(mailto(email), email) : escapeHTML(email || "Not given")],
  ];
  if (phone) details.push(["Phone", phone, dial ? link(`tel:${dial}`, phone) : escapeHTML(phone)]);
  details.push(["Opened from", source, escapeHTML(source)]);

  const detailRows = details.map(([label, , value]) => `  <tr>
    <td valign="top" width="128" bgcolor="${black}" style="width:128px;padding:12px 16px 12px 0;border-top:1px solid ${line};background-color:${black};${textStyle(16, 28, gray)}">${label}</td>
    <td valign="top" bgcolor="${black}" style="padding:12px 0;border-top:1px solid ${line};background-color:${black};${textStyle(18, 28, white)}word-break:break-word;">${value}</td>
  </tr>`).join("\n");

  const html = emailDocument(subject, preheader, [
    emailRow(logoMark(48), "0 0 32px 0"),
    emailRow(heading(escapeHTML(name ? `New message from ${name}` : "New message")), "0"),
    emailRow(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${surface}" style="background-color:${surface};">
  <tr>
    <td bgcolor="${surface}" style="padding:24px;background-color:${surface};${textStyle(18, 28, white)}word-break:break-word;">${message ? escapeHTML(message).replace(/\n/g, "<br/>") : "No message included."}</td>
  </tr>
</table>`,
      "24px 0 0 0",
    ),
    emailRow(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${detailRows}
</table>`,
      "24px 0 0 0",
      `border-bottom:1px solid ${line};`,
    ),
    canReply ? emailRow(button(escapeHTML(mailto(email)), firstName ? `Reply to ${escapeHTML(firstName)}` : "Reply"), "32px 0 0 0") : "",
    footerRow(`Sent by the contact form on <a href="${site}" target="_blank" style="color:${gray};text-decoration:none;">suphian.com</a>.`),
  ]);

  const text = [
    name ? `New message from ${name}` : "New message",
    message || "No message included.",
    details.map(([label, value]) => `${label}: ${value}`).join("\n"),
    canReply ? `Reply to this email to write back to ${firstName || email}.` : "",
    "Sent by the contact form on suphian.com.",
  ].filter(Boolean).join("\n\n");

  return { subject, preheader, html, text };
}

/** To the person who wrote in: a short thank-you, signed, with his links. */
export function renderThankYou({ name }: { name: string }): RenderedEmail {
  const { black, white, gray, grayDim, site, linkedin, github } = BRAND;
  const { subject, preheader, body, signOff, reason } = THANK_YOU;
  const title = THANK_YOU.heading(greetingName(name));
  const year = new Date().getFullYear();
  const footerLink = (href: string, label: string, paddingRight: string) =>
    `<td bgcolor="${black}" style="padding:0 ${paddingRight} 0 0;background-color:${black};${textStyle(16, 24, gray)}"><a href="${href}" target="_blank" style="color:${gray};text-decoration:none;">${label}</a></td>`;

  const html = emailDocument(subject, preheader, [
    emailRow(logoMark(64), "0 0 40px 0"),
    emailRow(heading(escapeHTML(title)), "0"),
    ...body.map((paragraph, i) => emailRow(escapeHTML(paragraph), i === 0 ? "20px 0 0 0" : "16px 0 0 0", textStyle(18, 28, white))),
    emailRow(signOff, "32px 0 0 0", `${textStyle(18, 28, white)}font-weight:600;`),
    emailRow(button(site, "Visit suphian.com"), "40px 0 0 0"),
    footerRow(`<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>${footerLink(linkedin, "LinkedIn", "24px")}${footerLink(github, "GitHub", "0")}</tr>
</table>
<p style="margin:16px 0 0 0;${textStyle(16, 24, grayDim)}">${escapeHTML(reason)}</p>
<p style="margin:8px 0 0 0;${textStyle(16, 24, grayDim)}">&copy; ${year} Suphian Tweel</p>`),
  ]);

  const text = [
    `${title}.`,
    ...body,
    `${signOff}\n${site}`,
    `LinkedIn: ${linkedin}\nGitHub: ${github}`,
    `${reason}\n© ${year} Suphian Tweel`,
  ].join("\n\n");

  return { subject, preheader, html, text };
}
