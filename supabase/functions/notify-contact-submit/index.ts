
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple HTML escaping function
function escapeHTML(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Website, LinkedIn, GitHub
const WEBSITE_LINK = "https://suphian.com";
const LINKEDIN_LINK = "https://linkedin.com/in/suphian";
const GITHUB_LINK = "https://github.com/suphian";
const GITHUB_ASTRONAUT_URL = "https://raw.githubusercontent.com/Suphian/suphiansite/main/u1327668621_logo_SUPH_--chaos_15_--ar_23_--profile_aa8enny_--st_b2040bf7-71f1-4263-bf3e-422f9561d81e.png";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    // Sanitize all potentially unsafe fields
    const name = escapeHTML(body.name ?? "");
    const email = escapeHTML(body.email ?? "");
    const phone = escapeHTML(body.phone ?? "");
    const subject = escapeHTML(body.subject ?? "");
    const messageRaw: string = typeof body.message === "string" ? body.message : "";
    const message = escapeHTML(messageRaw).replace(/\n/g, "<br/>");
    const source = escapeHTML(body.source ?? "");

    let contactInfoHtml = `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
    `;
    if (phone) {
      contactInfoHtml += `<p><strong>Phone:</strong> ${phone}</p>`;
    }

    const html = `
      <h2>New Contact Form Submission</h2>
      ${contactInfoHtml}
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong><br/>${message}</p>
      <hr />
      <p>Submission Source: ${source || "Unknown"}</p>
    `;

    // Updated "from" address to your verified domain
    const emailResponse = await resend.emails.send({
      from: "Contact Notification <hi@suphian.com>",
      to: ["suph.tweel@gmail.com"],
      subject: subject ? `Contact Form: ${subject}` : "New Contact Submission",
      html,
      reply_to: email ? email : undefined,
    });

    // Send confirmation to submitter (if they provided an email)
    let confirmEmailResponse: any = null;
    if (email) {
      // Custom user-provided HTML template
      const thankYouHtml = `
<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;background:#000000;">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thanks for reaching out</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:#000000;font-family:'Inter',Arial,sans-serif;color:#F9FAFB;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg,#000000 0%,#11131f 50%,#1a0f2d 100%);">
    <tr>
      <td align="center" style="padding:72px 16px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;background:#0F0F11;border:1px solid #222326;border-radius:16px;box-shadow:0 12px 48px rgba(0,0,0,.55);overflow:hidden;">

          <tr>
            <td style="padding:56px 48px 40px 48px;text-align:center;background:#0F0F11;">
              <img src="${GITHUB_ASTRONAUT_URL}" width="140" alt="Running astronaut illustration" style="display:block;margin:0 auto 28px auto;border-radius:12px;" />
              <h1 style="margin:0;font-size:28px;line-height:1.3;font-weight:700;letter-spacing:-0.4px;color:#FFFFFF;">
                Thanks for reaching out${name ? `, ${name}` : ''}! 🚀
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:44px 48px 32px 48px;text-align:left;">
              <p style="margin:0 0 26px 0;font-size:16px;line-height:1.6;font-weight:600;color:#E5E7EB;">
                Your message just completed its orbit and landed in my inbox. Expect a reply within 1–2 business days.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 36px 0;">
                <tr>
                  <td style="padding:24px 28px;background:#131517;border-left:4px solid #FF4B2B;border-radius:10px;font-style:italic;font-size:15px;line-height:1.5;color:#D1D5DB;">
                    ${message || 'No message included.'}
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px auto;">
                <tr>
                  <td align="center" bgcolor="#FF4B2B" style="border-radius:10px;">
                    <a href="${WEBSITE_LINK}" style="display:inline-block;padding:16px 32px;font-size:15px;font-weight:700;color:#0F0F11;text-decoration:none;">Visit Suphian.com</a>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="${LINKEDIN_LINK}" style="font-size:14px;font-weight:600;color:#E5E7EB;text-decoration:none;">LinkedIn</a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="${GITHUB_LINK}" style="font-size:14px;font-weight:600;color:#E5E7EB;text-decoration:none;">GitHub</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 48px;background:#0B0C0D;border-top:1px solid #222326;text-align:center;font-size:13px;line-height:1.45;color:#6B7280;">
              © ${new Date().getFullYear()} Suphian Tweel • New York, NY
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <style>
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
