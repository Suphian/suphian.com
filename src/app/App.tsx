import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";
import { LazyNotFound, LazyRoute } from "@/shared/components/common/LazyRoute";
import Index from "@/features/landing/pages/Index";
import Payments from "@/features/payments/pages/Payments";
import PaymentSuccess from "@/features/payments/pages/PaymentSuccess";
import PaymentCancel from "@/features/payments/pages/PaymentCancel";
import ManageBilling from "@/features/payments/pages/ManageBilling";
import Podcast from "@/features/podcast/pages/Podcast";
import Navbar from "@/shared/components/layout/Navbar";
import Footer from "@/shared/components/layout/Footer";
import Logo from "@/shared/components/layout/Logo";
import ScrollProgress from "@/shared/components/common/ScrollProgress";
import SEOHead from "@/shared/components/common/SEOHead";
import ErrorBoundary from "@/shared/components/common/ErrorBoundary";
import AnimatedBackground from "@/features/landing/components/AnimatedBackground";
import { useSpacebarGreeting } from "@/features/landing/hooks/useSpacebarGreeting";


// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const queryClient = new QueryClient();

const AppContent = () => {
  // Enable spacebar greeting functionality
  useSpacebarGreeting();

  // Check if we are in a production environment
  const isProduction = window.location.hostname === 'suphian.com' || 
                       window.location.hostname === 'www.suphian.com' ||
                       window.location.hostname === 'suph.ai' ||
                       window.location.hostname === 'www.suph.ai';
                       
  return (
    <>
      <AnimatedBackground />
      {!isProduction && (
        <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none">
          <span className="bg-yellow-500/90 text-black text-[10px] font-bold px-3 py-0.5 rounded-b-md shadow-md backdrop-blur-sm pointer-events-auto">
            STAGING
          </span>
        </div>
      )}
      <SEOHead />
      <ScrollProgress />
      <ScrollToTop />
      <Navbar />
      <Logo />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/customers" element={<Payments />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          <Route path="/manage-billing" element={<ManageBilling />} />
          <Route path="/podcast" element={<Podcast />} />
          <Route path="*" element={<LazyRoute><LazyNotFound /></LazyRoute>} />
        </Routes>
      </main>
      <Footer />
      <Analytics />
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;