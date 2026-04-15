import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TrendBarChartProps {
  data: { month: string; income: number; expense: number }[];
  isLoading: boolean;
}

export function TrendBarChart({ data, isLoading }: TrendBarChartProps) {
  const isDataEmpty = data.every(t => t.income === 0 && t.expense === 0);

  // Using consistent HEX colors for SVG compatibility in Recharts
  const COLORS = {
    income: "#10b981",
    expense: "#f43f5e",
    grid: "rgba(148, 163, 184, 0.1)",
    cursor: "rgba(148, 163, 184, 0.1)"
  };

  return (
    <div className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Financial Trends</h3>
          <p className="text-sm text-muted-foreground">Income vs Spending (Last 6 Months)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.income }} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.expense }} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expenses</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        {isDataEmpty && !isLoading ? (
          <div className="flex h-full items-center justify-center rounded-xl bg-muted/20">
            <p className="text-sm text-muted-foreground">Insufficient data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }} 
              barGap={8}
            >
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={COLORS.grid} />
              <XAxis 
                dataKey="month" 
                fontSize={11} 
                fontWeight={600}
                tickLine={false} 
                axisLine={false} 
                dy={10}
                tick={{ fill: 'currentColor', opacity: 0.5 }}
                className="text-muted-foreground"
              />
              <YAxis 
                fontSize={11} 
                fontWeight={600}
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `฿${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                tick={{ fill: 'currentColor', opacity: 0.5 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                cursor={{ fill: COLORS.cursor, radius: 4 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl border bg-background p-3 shadow-lg ring-1 ring-black/5">
                        <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
                        <div className="space-y-1.5">
                          {payload.map((p: any) => (
                            <div key={p.dataKey} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.fill }} />
                                <span className="text-xs font-medium text-muted-foreground">
                                  {p.dataKey === 'income' ? 'Income' : 'Spending'}
                                </span>
                              </div>
                              <span className="text-xs font-bold tabular-nums italic font-mono">
                                ฿{Number(p.value).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="income" 
                fill={COLORS.income} 
                radius={[4, 4, 4, 4]} 
                barSize={12}
                animationDuration={1000}
              />
              <Bar 
                dataKey="expense" 
                fill={COLORS.expense} 
                radius={[4, 4, 4, 4]} 
                barSize={12}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
