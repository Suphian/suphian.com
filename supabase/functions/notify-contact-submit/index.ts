
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
    // For message, escape, then only allow explicit newlines to become <br>
    const messageRaw: string = typeof body.message === "string" ? body.message : "";
    const message = escapeHTML(messageRaw).replace(/\n/g, "<br/>");
    const source = escapeHTML(body.source ?? "");
  
    const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${
        phone
          ? `<p><strong>Phone:</strong> ${phone}</p>`
          : ""
      }
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong><br/>${message}</p>
      <hr />
      <p>Submission Source: ${source || "Unknown"}</p>
    `;

    const emailResponse = await resend.emails.send({
      from: "Contact Notification <onboarding@resend.dev>",
      to: ["suph.tweel@gmail.com"],
      subject: subject ? `Contact Form: ${subject}` : "New Contact Submission",
      html,
      reply_to: email ? email : undefined
    });

    return new Response(JSON.stringify({ result: "ok", emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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

