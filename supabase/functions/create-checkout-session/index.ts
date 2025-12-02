import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      throw new Error("Stripe is not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const { priceType, successUrl, cancelUrl } = await req.json();
    
    console.log("Creating checkout session for:", priceType);

    // Get the appropriate price ID based on type
    let priceId: string;
    let mode: "payment" | "subscription";

    if (priceType === "one-time") {
      priceId = Deno.env.get("STRIPE_PRICE_ONE_TIME") || "";
      mode = "payment";
    } else if (priceType === "subscription") {
      priceId = Deno.env.get("STRIPE_PRICE_SUBSCRIPTION") || "";
      mode = "subscription";
    } else {
      throw new Error("Invalid price type");
    }

    if (!priceId) {
      console.error(`Price ID not found for type: ${priceType}`);
      throw new Error("Price configuration not found");
    }

    console.log("Using price ID:", priceId, "mode:", mode);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: successUrl || `${req.headers.get("origin")}/payment-success`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/payment-cancel`,
    });

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
