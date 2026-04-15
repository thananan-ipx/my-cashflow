import React from "react";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  income: number;
  expense: number;
  balance: number;
}

export function SummaryCards({ income, expense, balance }: SummaryCardsProps) {
  const items = [
    {
      label: "Total Income",
      value: income,
      icon: ArrowUpRight,
      color: "text-[oklch(0.645_0.246_143.11)]",
      bgColor: "bg-[oklch(0.645_0.246_143.11/0.1)]",
      trend: "Income this period",
    },
    {
      label: "Total Expenses",
      value: expense,
      icon: ArrowDownRight,
      color: "text-[oklch(0.627_0.265_30.366)]",
      bgColor: "bg-[oklch(0.627_0.265_30.366/0.1)]",
      trend: "Spending this period",
    },
    {
      label: "Net Balance",
      value: balance,
      icon: Wallet,
      color: "text-[oklch(0.623_0.214_259.815)]",
      bgColor: "bg-[oklch(0.623_0.214_259.815/0.1)]",
      trend: balance >= 0 ? "Surplus remaining" : "Deficit this period",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {items.map((item) => (
        <div 
          key={item.label}
          className="relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {item.label}
              </p>
              <h3 className={cn("text-3xl font-bold tabular-nums tracking-tight", item.color)}>
                ฿{item.value.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </h3>
            </div>
            <div className={cn("rounded-xl p-2.5", item.bgColor)}>
              <item.icon className={cn("size-5", item.color)} />
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            <div className={cn("h-1.5 w-1.5 rounded-full", 
              item.label === "Net Balance" && item.value < 0 ? "bg-destructive" : "bg-primary"
            )} />
            <p className="text-xs text-muted-foreground font-medium">
              {item.trend}
            </p>
          </div>
          
          {/* Subtle background decoration */}
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
            <item.icon className="size-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
