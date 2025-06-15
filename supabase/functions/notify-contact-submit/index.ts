import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// In-memory rate limit map (per edge function instance)
const rateLimitMap = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const RATE_LIMIT_MAX = 3; // Max 3 submissions per window per IP

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Security-Policy": "default-src 'self'; img-src *; script-src 'none'; object-src 'none'",
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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = getClientIp(req);

  // Rate limit logic per IP
  const now = Date.now();
  let user = rateLimitMap.get(ip);
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

    // Notification to site owner (keep other logic unchanged)
    const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br/>${message}</p>
      <hr />
      <p>Submission Source: ${source || "Unknown"}</p>
    `;

    // Send to site owner
    const emailResponse = await resend.emails.send({
      from: "Contact Notification <hi@suphian.com>",
      to: ["suph.tweel@gmail.com"],
      subject: "Contact Form Submission",
      html,
      reply_to: email ? email : undefined,
    });

    // Send confirmation to submitter (if email provided) -- unchanged, but enforce maxLength
    let confirmEmailResponse: any = null;
    if (email) {
      const thankYouHtml = `
<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;
  background:linear-gradient(135deg,#101014 0%,#1b1e2f 50%,#2d1b55 100%);">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thanks for reaching out</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:linear-gradient(135deg,#101014 0%,#1b1e2f 50%,#2d1b55 100%);
  font-family:'Inter',Arial,sans-serif;color:#F9FAFB;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:640px;background:#000000;
               border:1px solid #222326;border-radius:16px;
               box-shadow:0 12px 48px rgba(0,0,0,.55);overflow:hidden;">
          <tr>
            <td style="padding:32px 48px 24px 48px;text-align:center;background:#000000;">
              <img src="https://raw.githubusercontent.com/Suphian/suphiansite/main/u1327668621_logo_SUPH_--chaos_15_--ar_23_--profile_aa8enny_--st_b2040bf7-71f1-4263-bf3e-422f9561d81e.png"
                   width="140" alt="Running astronaut illustration"
                   style="display:block;margin:0 auto 28px auto;border-radius:12px;">
              <h1 style="margin:0 0 4px 0;font-size:28px;line-height:1.3;font-weight:700;
                         letter-spacing:-0.4px;color:#FFFFFF;">
                Thanks for reaching out${firstName ? `, ${firstName}` : ""}!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 48px 32px 48px;text-align:left;">
              <p style="margin:0 0 16px 0;color:#FFFFFF;font-size:16px;line-height:1.55;font-weight:500;">
                Your message just completed its orbit and landed in my inbox. Expect a reply within 1–2 business days.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="margin:0 0 32px 0;">
                <tr>
                  <td style="padding:24px 28px;background:#0A0A0A;
                             border-left:4px solid #FF4B2B;border-radius:10px;
                             font-style:italic;font-size:15px;line-height:1.5;color:#D1D5DB;">
                    ${message || 'No message included.'}
                  </td>
                </tr>
              </table>
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"
                     style="margin:0 auto 24px auto;">
                <tr>
                  <td align="center" bgcolor="#FF4B2B" style="border-radius:10px;">
                    <a href="https://suphian.com"
                       style="display:inline-block;padding:16px 32px;
                              font-size:15px;font-weight:700;color:#0F0F11;
                              text-decoration:none;">Visit Suphian.com</a>
                  </td>
                </tr>
              </table>
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"
                     style="margin:0 auto;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="https://linkedin.com/in/suphian"
                       style="font-size:14px;font-weight:600;color:#E5E7EB;text-decoration:none;">LinkedIn</a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://github.com/suphian"
                       style="font-size:14px;font-weight:600;color:#E5E7EB;text-decoration:none;">GitHub</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 48px;background:#0B0C0D;
                       border-top:1px solid #222326;text-align:center;
                       font-size:13px;line-height:1.45;color:#6B7280;">
              © ${new Date().getFullYear()} Suphian Tweel • New York, NY
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <style>
    @media (prefers-color-scheme: dark) {
      body { background:#000000 !important; }
    }
    @media only screen and (max-width:640px) {
      h1 { font-size:24px !important; }
      td { padding-left:24px !important; padding-right:24px !important; }
    }
  </style>
</body>
</html>
      `;
      confirmEmailResponse = await resend.emails.send({
        from: "Contact Notification <hi@suphian.com>",
        to: [email],
        subject: "🌕 Your message reached my inbox!",
        html: thankYouHtml,
        reply_to: "hi@suphian.com",
      });
    }

    return new Response(
      JSON.stringify({ result: "ok", emailResponse, confirmEmailResponse }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    // Only log errors server-side
    console.error("Notify Contact Submit error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
