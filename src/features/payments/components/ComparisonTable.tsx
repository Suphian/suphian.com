
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Monitor, Smartphone } from "lucide-react";

interface StreamingRates {
  [country: string]: {
    baseRate: number;
    taxation: number;
    flag: string;
  };
}

interface ComparisonTableProps {
  streamingRates: StreamingRates;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ streamingRates }) => {
  const countries = Object.entries(streamingRates).filter(([country]) => country !== "Default");

  const calculateFinalPayout = (baseRate: number, taxation: number, isMobile: boolean) => {
    const mobileAdjustment = isMobile ? -0.0002 : 0;
    const adjustedRate = baseRate + mobileAdjustment;
    return adjustedRate * (1 - taxation / 100);
  };

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Global Streaming Revenue Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Base Rate</TableHead>
                <TableHead>Device Adjustment</TableHead>
                <TableHead>Taxation</TableHead>
                <TableHead>Final Payout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countries.map(([country, rates]) => (
                <React.Fragment key={country}>
                  <TableRow>
                    <TableCell className="font-medium">
                      {rates.flag} {country}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Monitor className="h-4 w-4" />
                        Desktop
                      </div>
                    </TableCell>
                    <TableCell>${rates.baseRate.toFixed(6)}</TableCell>
                    <TableCell>$0.000000</TableCell>
                    <TableCell>{rates.taxation}%</TableCell>
                    <TableCell className="font-semibold">
                      ${calculateFinalPayout(rates.baseRate, rates.taxation, false).toFixed(6)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      {rates.flag} {country}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-4 w-4" />
                        Mobile
                      </div>
                    </TableCell>
                    <TableCell>${rates.baseRate.toFixed(6)}</TableCell>
                    <TableCell>-$0.000200</TableCell>
                    <TableCell>{rates.taxation}%</TableCell>
                    <TableCell className="font-semibold">
                      ${calculateFinalPayout(rates.baseRate, rates.taxation, true).toFixed(6)}
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
