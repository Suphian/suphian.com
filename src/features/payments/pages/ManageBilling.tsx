import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import supabase from "@/integrations/supabase/client";
import SEOHead from "@/shared/components/common/SEOHead";

const ManageBilling = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleManageBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          customerEmail: email,
          returnUrl: `${window.location.origin}/manage-billing`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast.error(error.message || "Failed to access billing portal. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead 
        title="Manage Billing | Suphian"
        description="Manage your subscription and billing details."
      />
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Manage Your Subscription</CardTitle>
            <CardDescription>
              Enter the email associated with your subscription to access the billing portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManageBilling} className="space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Access Billing Portal"
                )}
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground mt-4">
              You can update payment methods, view invoices, or cancel your subscription.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ManageBilling;
