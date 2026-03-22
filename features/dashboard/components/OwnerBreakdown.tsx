import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Users, User } from "lucide-react";

export type OwnerSummaryData = {
  income: number;
  expense: number;
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
  const cards = [
    { key: "joint", label: "กองกลาง", icon: Users, colorClass: "text-blue-500", bgClass: "bg-blue-50 dark:bg-blue-950/20" },
    { key: "new", label: "นิว", icon: User, colorClass: "text-emerald-500", bgClass: "bg-emerald-50 dark:bg-emerald-950/20" },
    { key: "save", label: "เซฟ", icon: User, colorClass: "text-purple-500", bgClass: "bg-purple-50 dark:bg-purple-950/20" },
  ] as const;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">สรุปยอดแยกตามกระเป๋า</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const stats = data[card.key];
          const Icon = card.icon;
          
          return (
            <Card key={card.key} className={cn("border-none shadow-sm", card.bgClass)}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className={cn("text-md font-bold", card.colorClass)}>
                  {card.label}
                </CardTitle>
                <Icon className={cn("w-4 h-4", card.colorClass)} />
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">รายรับ</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    +฿{stats.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">รายจ่าย</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">
                    -฿{stats.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">คงเหลือ</span>
                  <span className={cn("font-bold", stats.balance >= 0 ? card.colorClass : "text-rose-500")}>
                    ฿{stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}