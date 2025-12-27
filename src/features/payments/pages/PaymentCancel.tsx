import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { XCircle } from "lucide-react";
import SEOHead from "@/shared/components/common/SEOHead";

const PaymentCancel = () => {
  return (
    <>
      <SEOHead 
        title="Payment Cancelled | Suphian"
        description="Your payment was cancelled."
      />
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <XCircle className="h-16 w-16 text-muted-foreground mx-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Payment Cancelled</h1>
          <p className="text-muted-foreground mb-8">
            Your payment was cancelled. No charges were made. If you have any questions, please don't hesitate to reach out.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline">
              <Link to="/">Return Home</Link>
            </Button>
            <Button asChild>
              <Link to="/customers">Try Again</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentCancel;
