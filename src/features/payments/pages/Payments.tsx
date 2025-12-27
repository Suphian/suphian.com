import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Check, Loader2, Rocket, Calendar, Shield, ArrowRight, CheckCircle, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import supabase from "@/integrations/supabase/client";
import SEOHead from "@/shared/components/common/SEOHead";

const Payments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const isSuccess = searchParams.get("success") === "true";

  useEffect(() => {
    if (isSuccess) {
      toast.success("Payment successful! Thank you for your purchase.");
      // Clean up URL
      setSearchParams({});
    }
  }, [isSuccess, setSearchParams]);

  const handleCheckout = async (priceType: "one-time" | "subscription" | "both") => {
    setLoadingType(priceType);
    
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceType,
          successUrl: `${window.location.origin}/customers?success=true`,
          cancelUrl: `${window.location.origin}/customers`,
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

  // Success state view
  if (isSuccess) {
    return (
      <>
        <SEOHead 
          title="Payment Successful | Suphian"
          description="Your payment has been processed successfully."
        />
        <div className="min-h-screen bg-background pt-32 pb-16">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto">
              <div className="mb-12 text-center">
                <CheckCircle className="h-16 w-16 mx-auto mb-6" style={{ color: 'hsl(var(--primary))' }} />
                <h1 className="heading-lg mb-6" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  PAYMENT SUCCESSFUL
                </h1>
                <p className="paragraph mb-12" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  Thank you for your payment. You will receive a confirmation email shortly with the details of your purchase.
                </p>
              </div>
              
              <div className="border border-white/10 p-8 mb-8" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="h-5 w-5" style={{ color: 'rgba(255, 255, 255, 0.85)' }} />
                  <h2 className="text-sm font-mono font-semibold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                    NEED SUPPORT?
                  </h2>
                </div>
                <p className="text-sm font-mono mb-3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  If you have any questions or need assistance, please reach out:
                </p>
                <a 
                  href="mailto:hello@suphian.com" 
                  className="text-sm font-mono hover:opacity-70 transition-opacity link-underline"
                  style={{ color: 'hsl(var(--primary))' }}
                >
                  hello@suphian.com
                </a>
              </div>

              <div className="text-center">
                <Button 
                  asChild 
                  variant="outline"
                  className="font-mono text-xs border-white/20 hover:border-white/40 hover:bg-white/5"
                  style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                >
                  <a href="/">RETURN HOME</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Client Payment Portal | Suphian"
        description="Secure payment portal - $5,000 implementation fee and $100/month subscription."
      />
      <div className="min-h-screen bg-background pt-32 pb-16">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-16">
              <h1 className="heading-lg mb-6" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                CLIENT PAYMENT PORTAL
              </h1>
              <p className="paragraph" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                Your engagement follows a simple timeline. Here's how billing works.
              </p>
            </div>

            {/* Engagement Roadmap */}
            <div className="mb-20">
              <h2 className="text-xs font-mono font-semibold text-center mb-12 tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                ENGAGEMENT ROADMAP
              </h2>
              <div className="grid md:grid-cols-3 gap-8 md:gap-0 relative">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center px-4 relative">
                  <div className="w-12 h-12 flex items-center justify-center mb-4 border border-white/10" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                    <Rocket className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <div className="text-xs font-mono mb-2 tracking-wider" style={{ color: 'hsl(var(--primary))' }}>
                    STEP 1
                  </div>
                  <h3 className="text-sm font-mono font-semibold mb-3" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                    KICKOFF & BUILD
                  </h3>
                  <p className="text-xs font-mono leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Pay the one-time <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>$5,000 Implementation Fee</strong> to finalize your portal setup and secure data integration.
                  </p>
                </div>

                {/* Arrow 1 - Desktop only */}
                <div className="hidden md:flex absolute left-1/3 top-6 -translate-x-1/2 items-center justify-center w-8">
                  <ArrowRight className="h-4 w-4" style={{ color: 'rgba(255, 255, 255, 0.3)' }} />
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center px-4 relative">
                  <div className="w-12 h-12 flex items-center justify-center mb-4 border border-white/10" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                    <Calendar className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <div className="text-xs font-mono mb-2 tracking-wider" style={{ color: 'hsl(var(--primary))' }}>
                    STEP 2
                  </div>
                  <h3 className="text-sm font-mono font-semibold mb-3" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                    GO-LIVE
                  </h3>
                  <p className="text-xs font-mono leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Your portal launches and handover is complete. You're live and ready.
                  </p>
                </div>

                {/* Arrow 2 - Desktop only */}
                <div className="hidden md:flex absolute left-2/3 top-6 -translate-x-1/2 items-center justify-center w-8">
                  <ArrowRight className="h-4 w-4" style={{ color: 'rgba(255, 255, 255, 0.3)' }} />
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center px-4 relative">
                  <div className="w-12 h-12 flex items-center justify-center mb-4 border border-white/10" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                    <Shield className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <div className="text-xs font-mono mb-2 tracking-wider" style={{ color: 'hsl(var(--primary))' }}>
                    STEP 3
                  </div>
                  <h3 className="text-sm font-mono font-semibold mb-3" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                    ONGOING SUPPORT
                  </h3>
                  <p className="text-xs font-mono leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    The <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>$100/month Retainer</strong> begins after a 7-day trial to cover hosting, security, and maintenance.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Card */}
            <div className="mt-16 mb-12 relative z-10" id="payment-card-section">
              <div className="border-2 p-8" style={{ borderColor: 'hsl(var(--primary))', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                <div className="text-center mb-8">
                  <h2 className="text-lg font-mono font-semibold mb-3 tracking-wider flex items-center justify-center gap-2" style={{ color: 'rgba(255, 255, 255, 1)' }}>
                    <Sparkles className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                    GET STARTED TODAY
                  </h2>
                  <p className="text-sm font-mono mb-6" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    One checkout for everything
                  </p>
                </div>
                
                <div className="text-center mb-8">
                  <div className="text-5xl font-mono font-bold mb-3" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                    $5,000
                    <span className="text-base font-normal ml-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>today</span>
                  </div>
                  <div className="text-base font-mono" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    + $100<span className="text-sm">/month</span> after 7-day trial
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6 mb-8 pt-6 border-t border-white/10">
                  <div className="space-y-3">
                    <p className="text-sm font-mono font-semibold mb-3" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Implementation Fee includes:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                        <span className="text-sm font-mono" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Initial setup & configuration
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                        <span className="text-sm font-mono" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Custom implementation
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                        <span className="text-sm font-mono" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Documentation & training
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-mono font-semibold mb-3" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Monthly Retainer includes:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                        <span className="text-sm font-mono" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Hosting & infrastructure
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                        <span className="text-sm font-mono" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Security & maintenance
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                        <span className="text-sm font-mono" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Priority support
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <Button 
                  className="w-full font-mono text-sm py-6 border-0" 
                  size="lg"
                  onClick={() => handleCheckout("both")}
                  disabled={loadingType !== null}
                  style={{ 
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    fontSize: '0.875rem'
                  }}
                >
                  {loadingType === "both" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      PROCESSING...
                    </>
                  ) : (
                    "PAY NOW & START SUBSCRIPTION"
                  )}
                </Button>

                <p className="text-sm font-mono text-center mt-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  You'll be charged $5,000 today. Your $100/month subscription starts after a 7-day free trial.
                </p>
              </div>
            </div>

            {/* Alternate options */}
            <div className="text-center mb-12">
              <p className="text-sm font-mono mb-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Or pay separately:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={() => handleCheckout("one-time")}
                  disabled={loadingType !== null}
                  className="font-mono text-sm border-white/20 hover:border-white/40 hover:bg-white/5 px-6 py-2"
                  style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                >
                  {loadingType === "one-time" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Implementation Only ($5,000)
                </Button>
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={() => handleCheckout("subscription")}
                  disabled={loadingType !== null}
                  className="font-mono text-sm border-white/20 hover:border-white/40 hover:bg-white/5 px-6 py-2"
                  style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                >
                  {loadingType === "subscription" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Subscription Only ($100/mo)
                </Button>
              </div>
            </div>

            <p className="text-sm font-mono text-center" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Payments are processed securely via Stripe. Your payment information is never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payments;
