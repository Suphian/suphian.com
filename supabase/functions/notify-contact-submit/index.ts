import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

// In-memory rate limit map (per edge function instance)
const rateLimitMap = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const RATE_LIMIT_MAX = 3; // Max 3 submissions per window per IP

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY environment variable is not set!");
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  // Improved CSP for more restriction
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data: https://raw.githubusercontent.com https://suphian.com; script-src 'none'; object-src 'none'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "geolocation=(), microphone=()",
};

function escapeHTML(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const getClientIp = (req: Request): string => {
  // For edge functions, check X-Forwarded-For from proxy/CDN
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("cf-connecting-ip") || // Cloudflare
    "unknown";
  return ip;
};

// ---- BEGIN EMAIL TEMPLATES ----
// The two contact-form emails in the site's brand: red, near-black and white
// (the redesign's DESIGN-BRIEF.md and the :root tokens in its src/style.css).
// Email-safe HTML: tables, inline styles, a 600px column, and a bgcolor on
// every cell that holds text, so a client that drops or inverts a background
// never leaves white text on white.
//
// Values passed in must already be escaped with escapeHTML; nothing here
// escapes. The block is self-contained (no imports, no Deno APIs) and the
// BEGIN/END markers are anchors: a preview script extracts this block to
// render the same HTML outside Deno.

const BRAND = {
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

interface OwnerNotificationFields {
  name: string;
  firstName: string;
  email: string;
  phone: string; // "" when not given
  message: string; // newlines already turned into <br/>
  source: string; // what opened the form, e.g. "Navbar"
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

/** The shell both emails share: a full-bleed near-black canvas and a 600px column. */
function emailDocument(title: string, rows: string[]): string {
  const { black } = BRAND;
  return `<!DOCTYPE html>
<html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${title}</title>
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
<div role="article" aria-roledescription="email" aria-label="${title}" lang="en" dir="ltr">
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

/** To Suphian: who wrote, what they said, how to reach them, what opened the form. */
function renderOwnerNotification(f: OwnerNotificationFields): string {
  const { black, surface, white, gray, line, site } = BRAND;
  const link = (href: string, label: string) =>
    `<a href="${href}" style="color:${white};text-decoration:underline;">${label}</a>`;
  // tel: gets digits and "+" only. A phone with anything else in it (an
  // escaped character, say) is shown as plain text instead.
  const dial = /^[+\d\s().-]+$/.test(f.phone) ? f.phone.replace(/[^+\d]/g, "") : "";
  const details: [string, string][] = [
    ["Email", f.email ? link(`mailto:${f.email}`, f.email) : "Not given"],
  ];
  if (f.phone) details.push(["Phone", dial ? link(`tel:${dial}`, f.phone) : f.phone]);
  details.push(["Opened from", f.source || "Unknown"]);

  const detailRows = details.map(([label, value]) => `  <tr>
    <td valign="top" width="128" bgcolor="${black}" style="width:128px;padding:12px 16px 12px 0;border-top:1px solid ${line};background-color:${black};${textStyle(16, 28, gray)}">${label}</td>
    <td valign="top" bgcolor="${black}" style="padding:12px 0;border-top:1px solid ${line};background-color:${black};${textStyle(18, 28, white)}word-break:break-word;">${value}</td>
  </tr>`).join("\n");

  return emailDocument("New message", [
    emailRow(logoMark(48), "0 0 32px 0"),
    emailRow(heading(f.name ? `New message from ${f.name}` : "New message"), "0"),
    emailRow(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${surface}" style="background-color:${surface};">
  <tr>
    <td bgcolor="${surface}" style="padding:24px;background-color:${surface};${textStyle(18, 28, white)}word-break:break-word;">${f.message || "No message included."}</td>
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
    f.email ? emailRow(button(`mailto:${f.email}`, f.firstName ? `Reply to ${f.firstName}` : "Reply"), "32px 0 0 0") : "",
    footerRow(`Sent by the contact form on <a href="${site}" target="_blank" style="color:${gray};text-decoration:none;">suphian.com</a>.`),
  ]);
}

/** To the person who wrote in: a short thank-you, signed, with his links. */
function renderThankYou({ firstName }: { firstName: string }): string {
  const { black, white, gray, grayDim, site, linkedin, github } = BRAND;
  const footerLink = (href: string, label: string, paddingRight: string) =>
    `<td bgcolor="${black}" style="padding:0 ${paddingRight} 0 0;background-color:${black};${textStyle(16, 24, gray)}"><a href="${href}" target="_blank" style="color:${gray};text-decoration:none;">${label}</a></td>`;

  return emailDocument("Thanks for reaching out", [
    emailRow(logoMark(64), "0 0 40px 0"),
    emailRow(heading(`Thanks for reaching out${firstName ? `, ${firstName}` : ""}`), "0"),
    emailRow(
      "Your message just completed its orbit and landed in my inbox. I&rsquo;ll get back to you soon.",
      "20px 0 0 0",
      textStyle(18, 28, white),
    ),
    emailRow("Suphian", "32px 0 0 0", `${textStyle(18, 28, white)}font-weight:600;`),
    emailRow("Principal Product Manager at Steadily", "0", textStyle(16, 24, gray)),
    emailRow(button(site, "Visit suphian.com"), "40px 0 0 0"),
    footerRow(`<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>${footerLink(linkedin, "LinkedIn", "24px")}${footerLink(github, "GitHub", "0")}</tr>
</table>
<p style="margin:8px 0 0 0;${textStyle(16, 24, grayDim)}">&copy; ${new Date().getFullYear()} Suphian Tweel</p>`),
  ]);
}
// ---- END EMAIL TEMPLATES ----

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = getClientIp(req);

  // Rate limit logic per IP
  const now = Date.now();
  const user = rateLimitMap.get(ip);
  if (!user || now > user.ts + RATE_LIMIT_WINDOW_MS) {
    // Reset quota for window
    rateLimitMap.set(ip, { count: 1, ts: now });
  } else if (user.count >= RATE_LIMIT_MAX) {
    // Too many requests
    return new Response(
      JSON.stringify({ error: "Too many submissions. Please wait a minute and try again." }),
      { status: 429, headers: corsHeaders }
    );
  } else {
    user.count++;
    rateLimitMap.set(ip, user);
  }

  try {
    const body = await req.json();
    // Honeypot: if 'website' field is present and filled, block submission
    if (body.website && body.website.trim().length > 0) {
      return new Response(
        JSON.stringify({ error: "Bot detected. Submission blocked." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Sanitized fields with length limits
    const nameRaw = String(body.name ?? "").slice(0, 72);
    const name = escapeHTML(nameRaw);
    const firstName = name.split(" ")[0];
    const email = escapeHTML((body.email ?? "").slice(0, 160));
    // Limit message size as well
    const messageRaw: string = typeof body.message === "string" ? body.message.slice(0, 2500) : "";
    const message = escapeHTML(messageRaw).replace(/\n/g, "<br/>");
    const source = escapeHTML((body.source ?? "").slice(0, 48));
    // Optional. Both versions of the site send it; 48 is the form's own limit.
    const phone = escapeHTML(typeof body.phone === "string" ? body.phone.trim().slice(0, 48) : "");

    // Notification to site owner (keep other logic unchanged)
    const html = renderOwnerNotification({ name, firstName, email, phone, message, source });

    // Validate Resend is configured
    if (!resend) {
      console.error("❌ Resend API key not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Helper function to send email with retry logic
    const sendEmailWithRetry = async (
      emailData: Parameters<typeof resend.emails.send>[0],
      retries = 2,
      delay = 1000
    ): Promise<unknown> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await resend.emails.send(emailData);
          
          // Check if response indicates success
          if (response.error) {
            throw new Error(response.error.message || "Email send failed");
          }
          
          return response;
        } catch (error) {
          const isLastAttempt = attempt === retries;
          
          if (isLastAttempt) {
            console.error(`❌ Email send failed after ${retries + 1} attempts:`, error);
            throw error;
          }
          
          // Wait before retrying (exponential backoff)
          const waitTime = delay * Math.pow(2, attempt);
          console.warn(`⚠️ Email send attempt ${attempt + 1} failed, retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    };

    // Send to site owner with retry
    let emailResponse: unknown = null;
    try {
      emailResponse = await sendEmailWithRetry({
        from: "Contact Notification <hello@suphian.com>",
        to: ["hello@suphian.com"],
        subject: "Contact Form Submission",
        html,
        reply_to: email ? email : undefined,
      });
      console.log("✅ Owner notification email sent successfully");
    } catch (error) {
      console.error("❌ Failed to send owner notification email:", error);
      // Continue - we'll still try to send confirmation email
    }

    // Send confirmation to submitter (if email provided) with retry
    let confirmEmailResponse: unknown = null;
    if (email) {
      const thankYouHtml = renderThankYou({ firstName });
      try {
        confirmEmailResponse = await sendEmailWithRetry({
          from: "Suphian Tweel <hello@suphian.com>",
          to: [email],
          subject: "🌕 Your message reached my inbox!",
          html: thankYouHtml,
          reply_to: "hello@suphian.com",
        });
        console.log("✅ Confirmation email sent successfully to:", email);
      } catch (error) {
        console.error("❌ Failed to send confirmation email:", error);
        // Continue - form submission was still successful
      }
    }

    // Return success even if one email failed (form was submitted to database)
    const responseHasError = (r: unknown): boolean =>
      typeof r === "object" && r !== null && "error" in r && Boolean((r as { error?: unknown }).error);
    const hasErrors = (!emailResponse || responseHasError(emailResponse)) && (!confirmEmailResponse || responseHasError(confirmEmailResponse));
    
    return new Response(
      JSON.stringify({ 
        result: "ok", 
        emailResponse, 
        confirmEmailResponse,
        warnings: hasErrors ? ["Some emails may not have been sent, but your submission was received."] : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    // Log detailed error information
    console.error("❌ Notify Contact Submit error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });

    // Return user-friendly error message
    const errorMessage = err.message || "An unexpected error occurred while processing your submission.";
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        // Don't expose stack traces in production for security
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);

/**
 * NOTE:
 * For full Content Security Policy enforcement, consider setting HTTP headers
 * at the CDN/hosting level, e.g.:
 * - Strict-Transport-Security
 * - Content-Security-Policy
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 * The above code adds some of these as demo, but production should use hosting config.
 */
