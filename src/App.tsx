import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React, { useEffect } from "react";
import { LazyNotFound, LazyRoute } from "./components/LazyRoute";
import Index from "./pages/Index";
import Payments from "./pages/Payments";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import ManageBilling from "./pages/ManageBilling";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Logo from "./components/Logo";
import ScrollProgress from "./components/ScrollProgress";
import SEOHead from "./components/SEOHead";
import ErrorBoundary from "./components/ErrorBoundary";


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
  // Check if we are in a production environment
  const isProduction = window.location.hostname === 'suphian.com' || 
                       window.location.hostname === 'www.suphian.com';
                       
  return (
    <>
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
          <Route path="*" element={<LazyRoute><LazyNotFound /></LazyRoute>} />
        </Routes>
      </main>
      <Footer />
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