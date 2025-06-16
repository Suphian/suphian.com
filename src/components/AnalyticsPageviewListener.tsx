
import { useEffect } from "react";
import { trackPageView } from "@/utils/analytics/googleAnalytics";

/**
 * Analytics pageview listener component that tracks page views on route changes.
 * Add this component to your App tree after <BrowserRouter>.
 */
export function AnalyticsPageviewListener() {
  useEffect(() => {
    // Track the initial page load
    trackPageView();

    // Track GA pageview on every route/page change
    const onHistory = () => {
      setTimeout(trackPageView, 0); // next tick after route update
    };
    window.addEventListener("popstate", onHistory);
    window.addEventListener("pushstate", onHistory); // For SPA navigation
    window.addEventListener("replacestate", onHistory);

    // Also react to hash changes (e.g., anchor navigation)
    window.addEventListener("hashchange", onHistory);

    // You can use a MutationObserver or router events for more accuracy if needed

    return () => {
      window.removeEventListener("popstate", onHistory);
      window.removeEventListener("pushstate", onHistory);
      window.removeEventListener("replacestate", onHistory);
      window.removeEventListener("hashchange", onHistory);
    };
  }, []);
  return null;
}
