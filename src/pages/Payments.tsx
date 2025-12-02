import { useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from "@stripe/react-stripe-js";
import { Rocket, Calendar, Shield, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import supabase from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";

// Load Stripe outside of component to avoid recreating on each render
const stripePromise = loadStripe("pk_live_51S4FcTBROJBOfZpmZw2CdWQNjDJLJBNWLNJZBMqlg7opD1YXwVJNLvuBXg0I7FP3NVJPYBrC6axQVhJyIFbnWM0b00VnfWnQQf");

const Payments = () => {
  const fetchClientSecret = useCallback(async () => {
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
        return data.clientSecret;
      } else {
        throw new Error("No client secret returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Failed to load checkout. Please try again.");
      throw error;
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
                    The <strong>Monthly Retainer</strong> begins after a 7-day trial to cover hosting, security, and maintenance.
                  </p>
                </div>
              </div>
            </div>

            {/* Embedded Checkout */}
            <div id="checkout" className="max-w-xl mx-auto">
              <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Payments are processed securely via Stripe.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payments;
