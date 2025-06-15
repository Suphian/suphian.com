
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
const LINKEDIN_LINK = "https://www.linkedin.com/in/suphian/";
const GITHUB_LINK = "https://github.com/Suphian";
const MOON_ASTRONAUT_URL = "https://ujughujunixnwlmtdsxd.supabase.co/storage/v1/object/public/lovable-uploads/db2efd18-0555-427b-89b4-c5cae8a5a143.png";

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
      // Styling inspired by your website, with astronaut, bold colors, rounded corners, buttons.
      const thankYouHtml = `
  <html style="background: #18181B;">
  <body style="background:#18181B;font-family:'Montserrat',Arial,sans-serif;color:#fff;margin:0;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#18181B" style="padding:0;">
      <tr>
        <td align="center" style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#18181B" style="max-width:520px;margin:48px auto 0 auto;border-radius:21px;overflow:hidden;box-shadow:0 6px 48px #0003;border:1px solid #232328;">
            <tr>
              <td align="center" style="padding:36px 24px 12px 24px;background:#232328;">
                <img src="${MOON_ASTRONAUT_URL}" alt="Astronaut jumping over moon" width="128" height="auto" style="display:block;margin:0 auto 24px auto;border-radius:18px;" />
                <h2 style="font-size:1.7rem;letter-spacing:-1.2px;line-height:1.2;font-family:'Montserrat',Arial,sans-serif;margin:0 0 10px 0;color:#ff3b30;">
                  Thank you for reaching out${name ? `, ${name}!` : "!"} 🚀
                </h2>
                <p style="margin:0 0 16px 0;color:#fff;font-size:1rem;font-family:'Montserrat',Arial,sans-serif;">
                  Your message just completed its orbit.<br/>
                  I've received it and will follow up soon.<br/>
                  <span style="color:#ff9600;">In the meantime, shoot for the moon!</span>
                </p>
                <blockquote style="background:#191f22;border-left:5px solid #ff3b30;padding:18px 20px;font-style:italic;font-size:1.05rem;border-radius:13px;margin:32px 0 28px 0;color:#f6f6f6;">
                  ${message || "No message included."}
                </blockquote>
                <p style="margin:0 0 18px 0;font-size:0.97rem;color:#ccc;">
                  <span style="font-weight:bold;">Sent from:</span> <span style="color:#ff9600;">suphian.com</span>
                </p>
                <a href="${WEBSITE_LINK}" style="display:inline-block;margin:0 8px 0 0;padding:11px 26px;background:#ff3b30;color:#fff;font-family:'Montserrat',Arial,sans-serif;font-weight:600;font-size:1rem;border-radius:8px;text-decoration:none;box-shadow:0 2px 8px #ff3b3022;transition:background 0.3s;">Visit My Website</a>
                <a href="${LINKEDIN_LINK}" style="display:inline-block;margin:0 8px 0 0;padding:11px 22px;background:#0077b5;color:#fff;font-family:'Montserrat',Arial,sans-serif;font-weight:600;font-size:1rem;border-radius:8px;text-decoration:none;box-shadow:0 2px 8px #0077b533;transition:background 0.3s;">LinkedIn</a>
                <a href="${GITHUB_LINK}" style="display:inline-block;padding:11px 22px;background:#23272c;color:#fff;font-family:'Montserrat',Arial,sans-serif;font-weight:600;font-size:1rem;border-radius:8px;text-decoration:none;box-shadow:0 2px 7px #23272c2a;transition:background 0.3s;">GitHub</a>

                <hr style="border:none;border-top:1px solid #232328;margin:36px 0 16px 0;" />
                <p style="margin:0 0 2px 0;color:#adadad;font-size:0.97rem;">
                  <em>This is an automated confirmation.</em>
                </p>
                <p style="margin:0;color:#333;font-size:0.79rem;">
                  &copy; 2025 Suphian Tweel
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
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

