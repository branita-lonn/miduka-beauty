// components/dashboard/analytics/orders-chart.tsx
// Bar chart showing daily order counts using Recharts.

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, TooltipProps } from "recharts";

interface OrdersChartProps {
  data: { date: string; count: number }[];
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-3 rounded-2xl shadow-xl">
        <p className="text-sm font-bold mb-1">{label}</p>
        <p className="text-sm text-primary font-medium">
          Orders: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export function OrdersChart({ data }: OrdersChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Daily Orders</CardTitle>
        <CardDescription>Order volume across the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full min-h-[350px]">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <Tooltip cursor={{ fill: "hsl(var(--primary) / 0.05)" }} content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
              Loading Chart...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
