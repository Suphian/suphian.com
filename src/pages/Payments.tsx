import { useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from "@stripe/react-stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Rocket, Calendar, Shield, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import supabase from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";

// Load Stripe outside of component to avoid recreating on each render
const stripePromise = loadStripe("pk_live_51S4FcTBROJBOfZpmZw2CdWQNjDJLJBNWLNJZBMqlg7opD1YXwVJNLvuBXg0I7FP3NVJPYBrC6axQVhJyIFbnWM0b00VnfWnQQf");

const Payments = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchClientSecret = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceType: "both",
          returnUrl: window.location.origin,
          embedded: true,
        },
      });

      if (error) throw error;
      
      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
        return data.clientSecret;
      } else {
        throw new Error("No client secret returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Failed to load checkout. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const options = { fetchClientSecret };

  return (
    <>
      <SEOHead 
        title="Client Payment Portal | Suphian"
        description="Secure payment portal for implementation fees and subscriptions."
      />
      <div className="min-h-screen bg-background pt-24 pb-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Client Payment Portal</h1>
              <p className="text-lg text-muted-foreground">
                Your engagement follows a simple timeline. Here's how billing works.
              </p>
            </div>

            {/* Engagement Roadmap */}
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-center mb-8 text-muted-foreground">Engagement Roadmap</h2>
              <div className="grid md:grid-cols-3 gap-4 md:gap-0 relative">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Rocket className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-sm font-medium text-primary mb-1">Step 1</div>
                  <h3 className="font-semibold mb-2">Kickoff & Build</h3>
                  <p className="text-sm text-muted-foreground">
                    Pay the one-time <strong>Implementation Fee</strong> to finalize your portal setup and secure data integration.
                  </p>
                </div>

                {/* Arrow 1 - Desktop only */}
                <div className="hidden md:flex absolute left-1/3 top-6 -translate-x-1/2 items-center justify-center w-8">
                  <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-sm font-medium text-primary mb-1">Step 2</div>
                  <h3 className="font-semibold mb-2">Go-Live</h3>
                  <p className="text-sm text-muted-foreground">
                    Your portal launches and handover is complete. You're live and ready.
                  </p>
                </div>

                {/* Arrow 2 - Desktop only */}
                <div className="hidden md:flex absolute left-2/3 top-6 -translate-x-1/2 items-center justify-center w-8">
                  <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-sm font-medium text-primary mb-1">Step 3</div>
                  <h3 className="font-semibold mb-2">Ongoing Support</h3>
                  <p className="text-sm text-muted-foreground">
                    The <strong>Monthly Retainer</strong> begins automatically post-launch to cover hosting, security, and maintenance.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Summary Card */}
            <Card className="max-w-xl mx-auto border-2 border-primary mb-8">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Complete Package
                </CardTitle>
                <CardDescription>One checkout for everything</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">
                    $1,000
                    <span className="text-base font-normal text-muted-foreground ml-1">today</span>
                  </div>
                  <div className="text-lg text-muted-foreground">
                    + $100<span className="text-sm">/month</span> after 7-day trial
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4 pt-2 text-sm">
                  <div className="space-y-1.5">
                    <p className="font-medium">Implementation includes:</p>
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>Setup & configuration</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>Custom implementation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>Documentation & training</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-medium">Monthly includes:</p>
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>Hosting & infrastructure</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>Security & maintenance</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>Priority support</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Embedded Checkout */}
            <div id="checkout" className="max-w-xl mx-auto">
              <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Payments are processed securely via Stripe. Your payment information is never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payments;
