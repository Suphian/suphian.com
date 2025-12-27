
import React, { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Info, Monitor, Smartphone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { LocationService, LocationData } from "@/utils/analytics/locationService";

// Lazy load heavy chart components
const ComparisonTable = React.lazy(() => import("@/components/ComparisonTable").then(m => ({ default: m.ComparisonTable })));
const EarningsChart = React.lazy(() => import("@/components/EarningsChart").then(m => ({ default: m.EarningsChart })));

interface StreamingRates {
  [country: string]: {
    baseRate: number;
    taxation: number;
    flag: string;
  };
}

const streamingRates: StreamingRates = {
  "United States": { baseRate: 0.005, taxation: 15, flag: "🇺🇸" },
  "Canada": { baseRate: 0.0038, taxation: 10, flag: "🇨🇦" },
  "United Kingdom": { baseRate: 0.005, taxation: 20, flag: "🇬🇧" },
  "Germany": { baseRate: 0.0045, taxation: 19, flag: "🇩🇪" },
  "France": { baseRate: 0.0042, taxation: 25, flag: "🇫🇷" },
  "Australia": { baseRate: 0.0041, taxation: 12, flag: "🇦🇺" },
  "Japan": { baseRate: 0.0048, taxation: 8, flag: "🇯🇵" },
  "Brazil": { baseRate: 0.0025, taxation: 27, flag: "🇧🇷" },
  "India": { baseRate: 0.001, taxation: 5, flag: "🇮🇳" },
  "South Korea": { baseRate: 0.0035, taxation: 22, flag: "🇰🇷" },
  "Default": { baseRate: 0.004, taxation: 15, flag: "🌍" }
};

export const StreamingRevenueWidget: React.FC = () => {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { locationData } = await LocationService.fetchLocationData();
        setLocationData(locationData);
      } catch (error) {
        console.error("Failed to fetch location data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCountryRate = (country?: string) => {
    if (!country) return streamingRates["Default"];
    return streamingRates[country] || streamingRates["Default"];
  };

  const calculateEarnings = () => {
    const countryRate = getCountryRate(locationData?.country);
    const mobileAdjustment = isMobile ? -0.0002 : 0;
    const adjustedRate = countryRate.baseRate + mobileAdjustment;
    const afterTax = adjustedRate * (1 - countryRate.taxation / 100);
    
    return {
      baseRate: countryRate.baseRate,
      mobileAdjustment,
      adjustedRate,
      taxation: countryRate.taxation,
      finalPayout: afterTax,
      flag: countryRate.flag
    };
  };

  const earnings = calculateEarnings();

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Detecting your location and device...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Main Widget */}
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Your Streaming Revenue
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Real-time calculation based on your location and device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info Display */}
            <div className="flex flex-wrap gap-4">
              <Badge variant="secondary" className="text-lg p-2">
                {earnings.flag} {locationData?.country || "Unknown Location"}
              </Badge>
              <Badge variant="secondary" className="text-lg p-2">
                {isMobile ? <Smartphone className="h-4 w-4 mr-1" /> : <Monitor className="h-4 w-4 mr-1" />}
                {isMobile ? "Mobile" : "Desktop"}
              </Badge>
            </div>

            {/* Main Payout Display */}
            <div 
              className="text-center p-6 bg-secondary/20 rounded-lg"
              onMouseEnter={() => {
                window.trackEvent?.("revenue_widget_hover", {
                  element: "main_payout",
                  country: locationData?.country,
                  is_mobile: isMobile,
                  source: "StreamingRevenueWidget",
                  page: window.location.pathname
                });
              }}
            >
              <p className="text-sm text-muted-foreground mb-2">Each stream from your device and location earns:</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-3xl font-bold text-primary cursor-help">
                    ${earnings.finalPayout.toFixed(6)}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Base Rate ({locationData?.country}):</span>
                      <span>${earnings.baseRate.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Device Adjustment ({isMobile ? "Mobile" : "Desktop"}):</span>
                      <span>${earnings.mobileAdjustment.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>After Device Adjustment:</span>
                      <span>${earnings.adjustedRate.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxation ({earnings.taxation}%):</span>
                      <span>-${(earnings.adjustedRate * earnings.taxation / 100).toFixed(6)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold">
                      <span>Final Payout:</span>
                      <span>${earnings.finalPayout.toFixed(6)}</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
              <p className="text-xs text-muted-foreground mt-2">
                *Hover for detailed breakdown
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-card rounded-lg border">
                <div className="text-sm text-muted-foreground">1,000 Streams</div>
                <div className="font-semibold">${(earnings.finalPayout * 1000).toFixed(2)}</div>
              </div>
              <div className="text-center p-3 bg-card rounded-lg border">
                <div className="text-sm text-muted-foreground">10,000 Streams</div>
                <div className="font-semibold">${(earnings.finalPayout * 10000).toFixed(2)}</div>
              </div>
              <div className="text-center p-3 bg-card rounded-lg border">
                <div className="text-sm text-muted-foreground">100,000 Streams</div>
                <div className="font-semibold">${(earnings.finalPayout * 100000).toFixed(2)}</div>
              </div>
              <div className="text-center p-3 bg-card rounded-lg border">
                <div className="text-sm text-muted-foreground">1M Streams</div>
                <div className="font-semibold">${(earnings.finalPayout * 1000000).toFixed(0)}</div>
              </div>
            </div>

            {/* Toggle Comparison */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  const newState = !showComparison;
                  setShowComparison(newState);
                  
                  window.trackEvent?.("revenue_widget_toggle", {
                    action: newState ? "expand" : "collapse",
                    source: "StreamingRevenueWidget",
                    page: window.location.pathname
                  });
                }}
                className="w-full md:w-auto"
              >
                {showComparison ? (
                  <>
                    Hide Comparison <ChevronUp className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Compare Countries & Devices <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Section */}
        {showComparison && (
          <div className="space-y-6">
            <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-lg" />}>
              <ComparisonTable streamingRates={streamingRates} />
            </Suspense>
            <Suspense fallback={<div className="animate-pulse bg-muted h-64 rounded-lg" />}>
              <EarningsChart streamingRates={streamingRates} />
            </Suspense>
          </div>
        )}

        {/* Disclaimer */}
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Disclaimer:</strong> These calculations are estimations based on publicly available average data. 
              Actual streaming payouts may vary significantly based on platform, label agreements, and other factors. 
              This tool is for educational purposes only.
            </p>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};
