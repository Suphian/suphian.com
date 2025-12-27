import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const PaymentSuccess = () => {
  return (
    <>
      <SEOHead 
        title="Payment Successful | Suphian"
        description="Your payment has been processed successfully."
      />
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your payment. You will receive a confirmation email shortly with the details of your purchase.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/">Return Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/manage-billing">Manage Subscription</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;
