
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React, { useEffect, Suspense } from "react";
import { LazyIndex, LazyNotFound, LazyRoute } from "./components/LazyRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Logo from "./components/Logo";
import ScrollProgress from "./components/ScrollProgress";
import SEOHead from "./components/SEOHead";
import { AnalyticsPageviewListener } from "./components/AnalyticsPageviewListener";
import { useEventTracker } from "./hooks/useEventTracker";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load auth pages
const LazyAuth = React.lazy(() => import("./pages/Auth"));
const LazyAdmin = React.lazy(() => import("./pages/Admin"));


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
  // Initialize event tracking for the entire app
  useEventTracker({
    autoTrackPageViews: true,
    autoTrackClicks: true,
    autoTrackScrollEvents: true
  });

  return (
    <>
      <SEOHead />
      <ScrollProgress />
      <ScrollToTop />
      <AnalyticsPageviewListener />
      <Navbar />
      <Logo />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<LazyRoute><LazyIndex /></LazyRoute>} />
          <Route path="/auth" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
              <LazyAuth />
            </Suspense>
          } />
          <Route path="/admin" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
              <ProtectedRoute requireAdmin={true}>
                <LazyAdmin />
              </ProtectedRoute>
            </Suspense>
          } />
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
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
