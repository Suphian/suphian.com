import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CreditCard, Loader2 } from "lucide-react";
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
                Select your payment option below to proceed with secure checkout.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* One-Time Implementation Fee */}
              <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
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
              <Card className="relative overflow-hidden border-2 border-primary">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">
                  Recommended
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Monthly Subscription
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
                      <span className="text-sm">Ongoing support & maintenance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Priority response time</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Monthly strategy calls</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Cancel anytime</span>
                    </li>
                  </ul>

                  <Button 
                    className="w-full" 
                    size="lg"
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
