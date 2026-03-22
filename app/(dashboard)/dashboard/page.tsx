"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { th } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { LEGACY_LABELS, LEGACY_COLORS } from "@/lib/constants";
import { fetchDashboardTransactions, DashboardExpense, DashboardIncome } from "@/features/dashboard/services/dashboard.action";
import { SummaryCards } from "@/features/dashboard/components/SummaryCards";
import { ExpensePieChart } from "@/features/dashboard/components/ExpensePieChart";
import { TrendBarChart } from "@/features/dashboard/components/TrendBarChart";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [rawExpenses, setRawExpenses] = useState<DashboardExpense[]>([]);
  const [rawIncomes, setRawIncomes] = useState<DashboardIncome[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      const earliestDate = date?.from && date.from < sixMonthsAgo ? date.from : sixMonthsAgo;

      const { expenses, incomes } = await fetchDashboardTransactions(earliestDate);
      setRawExpenses(expenses);
      setRawIncomes(incomes);
    } catch (error) {
      if (error instanceof Error) toast.error("ดึงข้อมูลล้มเหลว: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [date?.from]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const processedData = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, { value: number; color: string }> = {};

    const fromDate = date?.from ? startOfDay(date.from) : startOfMonth(new Date());
    const toDate = date?.to ? endOfDay(date.to) : endOfDay(new Date());

    rawIncomes.forEach((inc) => {
      const incDate = new Date(inc.created_at);
      if (incDate >= fromDate && incDate <= toDate) {
        totalIncome += Number(inc.amount);
      }
    });

    rawExpenses.forEach((exp) => {
      const expDate = new Date(exp.date);
      if (expDate >= fromDate && expDate <= toDate) {
        totalExpense += Number(exp.amount);
        
        const catName = exp.transaction_categories?.name || LEGACY_LABELS[exp.category] || exp.category || "อื่นๆ";
        const catColor = exp.transaction_categories?.color || LEGACY_COLORS[exp.category] || "#f43f5e";
        
        if (!categoryTotals[catName]) {
          categoryTotals[catName] = { value: 0, color: catColor };
        }
        categoryTotals[catName].value += Number(exp.amount);
      }
    });

    const pieData = Object.entries(categoryTotals)
      .map(([name, data]) => ({ name, value: data.value, color: data.color }))
      .sort((a, b) => b.value - a.value);

    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = subMonths(new Date(), i);
      const m = targetMonth.getMonth() + 1;
      const y = targetMonth.getFullYear();
      const monthLabel = format(targetMonth, "MMM", { locale: th });

      const mIncome = rawIncomes
        .filter((inc) => inc.month === m && inc.year === y)
        .reduce((sum, inc) => sum + Number(inc.amount), 0);
        
      const mExpense = rawExpenses
        .filter((exp) => exp.month === m && exp.year === y)
        .reduce((sum, exp) => sum + Number(exp.amount), 0);

      trendData.push({ month: monthLabel, income: mIncome, expense: mExpense });
    }

    return {
      summary: { income: totalIncome, expense: totalExpense, balance: totalIncome - totalExpense },
      pieData,
      trendData
    };
  }, [rawExpenses, rawIncomes, date]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ภาพรวมการเงิน</h1>
          {isLoading && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Loader2 className="w-3 h-3 animate-spin"/> กำลังคำนวณข้อมูล...
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button id="date" variant={"outline"} className={cn("w-65 justify-start text-left font-normal bg-card", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>{format(date.from, "d MMM yyyy", { locale: th })} - {format(date.to, "d MMM yyyy", { locale: th })}</>
                  ) : (format(date.from, "d MMM yyyy", { locale: th }))
                ) : (<span>เลือกช่วงเวลา</span>)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={th} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <SummaryCards 
        income={processedData.summary.income} 
        expense={processedData.summary.expense} 
        balance={processedData.summary.balance} 
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ExpensePieChart data={processedData.pieData} isLoading={isLoading} />
        <TrendBarChart data={processedData.trendData} isLoading={isLoading} />
      </div>
    </div>
  );
}