import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CreditCard, Loader2, Rocket, Calendar, Shield, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import supabase from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";

const Payments = () => {
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const handleCheckout = async (priceType: "one-time" | "subscription") => {
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
            <div className="mb-16">
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

            <div className="grid md:grid-cols-2 gap-8">
              {/* One-Time Implementation Fee */}
              <Card className="relative overflow-hidden border-2 border-primary hover:border-primary/80 transition-colors">
                <div className="absolute top-0 left-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">
                  Step 1: Start Here
                </div>
                <CardHeader className="pt-10">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Implementation Fee
                  </CardTitle>
                  <CardDescription>One-time payment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-4xl font-bold">
                    $1,000
                    <span className="text-base font-normal text-muted-foreground ml-2">USD</span>
                  </div>
                  
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Initial setup & configuration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Custom implementation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Documentation & training</span>
                    </li>
                  </ul>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => handleCheckout("one-time")}
                    disabled={loadingType !== null}
                  >
                    {loadingType === "one-time" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Pay Now"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Monthly Subscription */}
              <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
                <div className="absolute top-0 left-0 bg-muted text-muted-foreground px-3 py-1 text-xs font-medium">
                  Starts After Go-Live
                </div>
                <CardHeader className="pt-10">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Monthly Retainer
                  </CardTitle>
                  <CardDescription>Recurring billing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-4xl font-bold">
                    $100
                    <span className="text-base font-normal text-muted-foreground ml-2">/month</span>
                  </div>
                  
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Hosting & infrastructure</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Security & maintenance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Priority support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Cancel anytime</span>
                    </li>
                  </ul>

                  <Button 
                    className="w-full" 
                    size="lg"
                    variant="outline"
                    onClick={() => handleCheckout("subscription")}
                    disabled={loadingType !== null}
                  >
                    {loadingType === "subscription" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </CardContent>
              </Card>
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
