import { format, addMonths } from "date-fns";
import { th } from "date-fns/locale";
import { CreditCard, Calendar as CalendarIcon, TrendingDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Debt } from "@/types";

interface DebtCardProps {
  debt: Debt;
}

export function DebtCard({ debt }: DebtCardProps) {
  const calculateProgress = (debtItem: Debt) => {
    if (!debtItem.remaining_installments || !debtItem.total_amount) return 0;
    
    const remainingBalance = debtItem.remaining_installments * debtItem.monthly_payment;
    const paidAmount = debtItem.total_amount - remainingBalance;
    
    if (paidAmount <= 0) return 0;
    
    const progress = (paidAmount / debtItem.total_amount) * 100;
    return Math.min(Math.max(progress, 0), 100); 
  };

  const calculatePayoffDate = (remainingMonths: number | null) => {
    if (!remainingMonths) return "ไม่ระบุ";
    const payoffDate = addMonths(new Date(), remainingMonths);
    return format(payoffDate, "MMMM yyyy", { locale: th });
  };

  const progress = calculateProgress(debt);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            {debt.name}
          </CardTitle>
          <span className="text-sm font-bold text-rose-500">
            -฿{debt.monthly_payment.toLocaleString()}/เดือน
          </span>
        </div>
        <CardDescription>
          ยอดรวม: ฿{debt.total_amount.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 grow space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>ความคืบหน้า</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm pt-2">
          <div className="bg-muted/50 p-2 rounded-md">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3" /> งวดที่เหลือ
            </p>
            <p className="font-medium">
              {debt.remaining_installments ? `${debt.remaining_installments} งวด` : 'ไม่ระบุ'}
            </p>
          </div>
          <div className="bg-muted/50 p-2 rounded-md">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <CalendarIcon className="w-3 h-3" /> คาดว่าจะปิดได้
            </p>
            <p className="font-medium text-primary">
              {calculatePayoffDate(debt.remaining_installments)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}