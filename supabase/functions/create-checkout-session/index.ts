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

    const oneTimePriceId = Deno.env.get("STRIPE_PRICE_ONE_TIME") || "";
    const subscriptionPriceId = Deno.env.get("STRIPE_PRICE_SUBSCRIPTION") || "";

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let mode: "payment" | "subscription" = "payment";

    if (priceType === "one-time") {
      if (!oneTimePriceId) throw new Error("One-time price not configured");
      lineItems = [{ price: oneTimePriceId, quantity: 1 }];
      mode = "payment";
    } else if (priceType === "subscription") {
      if (!subscriptionPriceId) throw new Error("Subscription price not configured");
      lineItems = [{ price: subscriptionPriceId, quantity: 1 }];
      mode = "subscription";
    } else if (priceType === "both") {
      if (!oneTimePriceId || !subscriptionPriceId) {
        throw new Error("Price configuration not found");
      }
      lineItems = [
        { price: oneTimePriceId, quantity: 1 },
        { price: subscriptionPriceId, quantity: 1 },
      ];
      mode = "subscription";
    } else {
      throw new Error("Invalid price type");
    }

    console.log("Line items:", lineItems.length, "mode:", mode);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: lineItems,
      mode: mode,
      success_url: successUrl || `${req.headers.get("origin")}/customers?success=true`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/customers`,
    };

    // Add 7-day free trial for subscriptions
    if (mode === "subscription") {
      sessionParams.subscription_data = {
        trial_period_days: 7,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

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
