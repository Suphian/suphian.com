import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
// The email templates and their copy. Deploy bundles this sibling module.
import { FROM, INBOX, isEmailAddress, renderOwnerNotification, renderThankYou } from "./emails.ts";

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

    // Raw fields with length limits. emails.ts escapes them for HTML; the
    // addresses and plain-text parts need them unescaped.
    const name = String(body.name ?? "").slice(0, 72);
    const emailInput = String(body.email ?? "").trim().slice(0, 254);
    // Only a well-formed address gets the reply-to and the thank-you.
    const email = isEmailAddress(emailInput) ? emailInput : "";
    const message: string = typeof body.message === "string" ? body.message.slice(0, 2500) : "";
    const source = String(body.source ?? "").slice(0, 48);
    // Optional. Both versions of the site send it; 48 is the form's own limit.
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 48) : "";

    const ownerEmail = renderOwnerNotification({ name, email: emailInput, phone, message, source });

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
        from: FROM.owner,
        to: [INBOX],
        subject: ownerEmail.subject,
        html: ownerEmail.html,
        text: ownerEmail.text,
        // Replying answers the person who wrote in.
        reply_to: email || undefined,
      });
      console.log("✅ Owner notification email sent successfully");
    } catch (error) {
      console.error("❌ Failed to send owner notification email:", error);
      // Continue - we'll still try to send confirmation email
    }

    // Send confirmation to submitter (if a valid email was given) with retry
    let confirmEmailResponse: unknown = null;
    if (email) {
      const thankYou = renderThankYou({ name });
      try {
        confirmEmailResponse = await sendEmailWithRetry({
          from: FROM.thankYou,
          to: [email],
          subject: thankYou.subject,
          html: thankYou.html,
          text: thankYou.text,
          reply_to: INBOX,
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
