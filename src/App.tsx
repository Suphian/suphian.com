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
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Logo from "./components/Logo";
import ScrollProgress from "./components/ScrollProgress";
import SEOHead from "./components/SEOHead";


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
  return (
    <>
      <SEOHead />
      <ScrollProgress />
      <ScrollToTop />
      <Navbar />
      <Logo />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          <Route path="*" element={<LazyRoute><LazyNotFound /></LazyRoute>} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;