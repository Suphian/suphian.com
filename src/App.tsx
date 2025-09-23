import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React, { useEffect } from "react";
import { LazyIndex, LazyNotFound, LazyRoute } from "./components/LazyRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Logo from "./components/Logo";
import ScrollProgress from "./components/ScrollProgress";
import SEOHead from "./components/SEOHead";
// LazyAnalytics will be imported dynamically


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
  // Lazy load analytics after user interaction
  React.useEffect(() => {
    const loadAnalytics = async () => {
      const events = ['click', 'scroll', 'keydown', 'touchstart'] as const;
      const onInteraction = async () => {
        events.forEach(event => document.removeEventListener(event, onInteraction));
        try {
          const { LazyAnalytics } = await import("./components/LazyAnalytics");
          // Analytics loaded - no need to render component as it handles itself
        } catch (error) {
          console.warn('Failed to load analytics:', error);
        }
      };
      
      events.forEach(event => 
        document.addEventListener(event, onInteraction, { passive: true } as AddEventListenerOptions)
      );
      
      // Fallback: load after 3 seconds
      setTimeout(onInteraction, 3000);
    };
    
    loadAnalytics();
  }, []);

  return (
    <>
      <SEOHead />
      <ScrollProgress />
      <ScrollToTop />
      <Navbar />
      <Logo />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<LazyRoute><LazyIndex /></LazyRoute>} />
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