import { cn } from "@/lib/utils";
import { Users, User, ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react";

export type OwnerSummaryData = {
  income: number;
  expense: number;
  transferIn: number;
  transferOut: number;
  balance: number;
};

export type OwnerBreakdownData = {
  joint: OwnerSummaryData;
  new: OwnerSummaryData;
  save: OwnerSummaryData;
};

interface OwnerBreakdownProps {
  data: OwnerBreakdownData;
}

export function OwnerBreakdown({ data }: OwnerBreakdownProps) {
  const configs = [
    { 
      key: "joint", 
      label: "กองกลาง (Joint)", 
      icon: Users, 
      color: "oklch(0.623 0.214 259.815)", // Blue
      bg: "oklch(0.623 0.214 259.815 / 0.05)"
    },
    { 
      key: "new", 
      label: "นิว (New)", 
      icon: User, 
      color: "oklch(0.645 0.246 143.11)", // Emerald
      bg: "oklch(0.645 0.246 143.11 / 0.05)"
    },
    { 
      key: "save", 
      label: "เซฟ (Save)", 
      icon: User, 
      color: "oklch(0.627 0.265 30.366)", // Rose-ish / Pink
      bg: "oklch(0.627 0.265 30.366 / 0.05)"
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Accounts Overview</h2>
        <div className="h-px flex-1 mx-4 bg-border/60" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {configs.map((config) => {
          const stats = data[config.key];
          const Icon = config.icon;
          
          return (
            <div 
              key={config.key} 
              className="group relative flex flex-col rounded-2xl border bg-card p-5 transition-all hover:ring-2 hover:ring-offset-2"
              style={{ '--tw-ring-color': config.color } as React.CSSProperties}
            >
              <div className="mb-4 flex items-center justify-between">
                <div 
                  className="rounded-lg p-2"
                  style={{ backgroundColor: config.bg, color: config.color }}
                >
                  <Icon className="size-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                  {config.label}
                </span>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                <h4 className={cn(
                  "text-2xl font-bold tabular-nums tracking-tight",
                  stats.balance < 0 ? "text-destructive" : ""
                )}
                style={stats.balance >= 0 ? { color: config.color } : {}}>
                  ฿{stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h4>
              </div>

              <div className="mt-auto space-y-3 pt-4 border-t border-dashed">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <TrendingUp className="size-3 text-[oklch(0.645_0.246_143.11)]" />
                    Income
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    ฿{(stats.income + stats.transferIn).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <TrendingDown className="size-3 text-[oklch(0.627_0.265_30.366)]" />
                    Spending
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    ฿{(stats.expense + stats.transferOut).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Transfers Indicator */}
                {(stats.transferIn > 0 || stats.transferOut > 0) && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
                    <ArrowRightLeft className="size-3 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                      Transfers included
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
