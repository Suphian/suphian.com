import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { LazyRoute } from "@/shared/components/common/LazyRoute";
import Index from "@/features/landing/pages/Index";
import NotFound from "@/pages/NotFound";

// Lazy load non-critical routes
const Payments = lazy(() => import("@/features/payments/pages/Payments"));
const PaymentSuccess = lazy(() => import("@/features/payments/pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("@/features/payments/pages/PaymentCancel"));
const ManageBilling = lazy(() => import("@/features/payments/pages/ManageBilling"));
const Podcast = lazy(() => import("@/features/podcast/pages/Podcast"));
import Navbar from "@/shared/components/layout/Navbar";
import Footer from "@/shared/components/layout/Footer";
import Logo from "@/shared/components/layout/Logo";
import ScrollProgress from "@/shared/components/common/ScrollProgress";
import SEOHead from "@/shared/components/common/SEOHead";
import ErrorBoundary from "@/shared/components/common/ErrorBoundary";
import AnimatedBackground from "@/features/landing/components/AnimatedBackground";
import { useSpacebarGreeting } from "@/features/landing/hooks/useSpacebarGreeting";
import { AnalyticsDebugOverlay } from "@/shared/components/dev/AnalyticsDebugOverlay";

// Lazy load analytics to keep it out of the main bundle (retry once on failure)
const LazyAnalytics = lazy(() =>
  import("@/shared/components/analytics/AnalyticsProvider").catch(
    () => new Promise<void>((r) => setTimeout(r, 1500)).then(
      () => import("@/shared/components/analytics/AnalyticsProvider")
    )
  )
);


// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Portfolio data is largely static, so avoid refetch churn on tab focus and
// keep results fresh for several minutes.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <AnimatedBackground />
      <AnalyticsDebugOverlay />
      <ErrorBoundary silent><Suspense fallback={null}><LazyAnalytics /></Suspense></ErrorBoundary>
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
      <main id="main-content" className="min-h-screen">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/customers" element={<LazyRoute><Payments /></LazyRoute>} />
          <Route path="/payment-success" element={<LazyRoute><PaymentSuccess /></LazyRoute>} />
          <Route path="/payment-cancel" element={<LazyRoute><PaymentCancel /></LazyRoute>} />
          <Route path="/manage-billing" element={<LazyRoute><ManageBilling /></LazyRoute>} />
          <Route path="/podcast" element={<LazyRoute><Podcast /></LazyRoute>} />
          <Route path="*" element={<NotFound />} />
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