import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CreditCard, Loader2, Rocket, Calendar, Shield, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import supabase from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";

const Payments = () => {
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const handleCheckout = async (priceType: "one-time" | "subscription" | "both") => {
    setLoadingType(priceType);
    
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceType,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-cancel`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoadingType(null);
    }
  };

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

            {/* Combined Payment Card */}
            <Card className="max-w-xl mx-auto border-2 border-primary mb-8">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                Complete Package
              </div>
              <CardHeader className="text-center pt-8">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Get Started Today
                </CardTitle>
                <CardDescription>One checkout for everything</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    $1,000
                    <span className="text-lg font-normal text-muted-foreground ml-1">today</span>
                  </div>
                  <div className="text-xl text-muted-foreground">
                    + $100<span className="text-sm">/month</span> after launch
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Implementation Fee includes:</p>
                    <ul className="space-y-1.5">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">Initial setup & configuration</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">Custom implementation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">Documentation & training</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Monthly Retainer includes:</p>
                    <ul className="space-y-1.5">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">Hosting & infrastructure</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">Security & maintenance</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">Priority support</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleCheckout("both")}
                  disabled={loadingType !== null}
                >
                  {loadingType === "both" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Pay Now & Start Subscription"
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  You'll be charged $1,000 today. Your $100/month subscription begins after go-live.
                </p>
              </CardContent>
            </Card>

            {/* Alternate options */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">Or pay separately:</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCheckout("one-time")}
                  disabled={loadingType !== null}
                >
                  {loadingType === "one-time" ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : null}
                  Implementation Only ($1,000)
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCheckout("subscription")}
                  disabled={loadingType !== null}
                >
                  {loadingType === "subscription" ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : null}
                  Subscription Only ($100/mo)
                </Button>
              </div>
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
