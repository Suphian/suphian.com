
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface StreamingRates {
  [country: string]: {
    baseRate: number;
    taxation: number;
    flag: string;
  };
}

interface EarningsChartProps {
  streamingRates: StreamingRates;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#0000ff'];

export const EarningsChart: React.FC<EarningsChartProps> = ({ streamingRates }) => {
  const countries = Object.entries(streamingRates).filter(([country]) => country !== "Default");

  const calculateFinalPayout = (baseRate: number, taxation: number, isMobile: boolean) => {
    const mobileAdjustment = isMobile ? -0.0002 : 0;
    const adjustedRate = baseRate + mobileAdjustment;
    return adjustedRate * (1 - taxation / 100);
  };

  const chartData = countries.map(([country, rates]) => ({
    country: country.split(' ')[0], // Shorten country names for chart
    desktop: calculateFinalPayout(rates.baseRate, rates.taxation, false) * 1000000, // Convert to per million streams
    mobile: calculateFinalPayout(rates.baseRate, rates.taxation, true) * 1000000,
    taxation: rates.taxation,
  }));

  const pieData = countries.map(([country, rates], index) => ({
    name: country,
    value: calculateFinalPayout(rates.baseRate, rates.taxation, false) * 1000000,
    fill: COLORS[index % COLORS.length],
  }));

  const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "hsl(var(--chart-1))",
    },
    mobile: {
      label: "Mobile",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings per Million Streams</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="country" 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(0)}`,
                  name === "desktop" ? "Desktop" : "Mobile"
                ]}
              />
              <Bar dataKey="desktop" fill="var(--color-desktop)" />
              <Bar dataKey="mobile" fill="var(--color-mobile)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Distribution (Desktop)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip 
                formatter={(value: number) => [`$${value.toFixed(0)}`, "Per Million Streams"]}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
