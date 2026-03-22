"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format, subMonths } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LEGACY_LABELS, LEGACY_COLORS } from "@/lib/constants";
import { fetchDashboardTransactions, DashboardExpense, DashboardIncome } from "@/features/dashboard/services/dashboard.action";
import { SummaryCards } from "@/features/dashboard/components/SummaryCards";
import { ExpensePieChart } from "@/features/dashboard/components/ExpensePieChart";
import { TrendBarChart } from "@/features/dashboard/components/TrendBarChart";
import { OwnerBreakdown, OwnerBreakdownData } from "@/features/dashboard/components/OwnerBreakdown";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const [rawExpenses, setRawExpenses] = useState<DashboardExpense[]>([]);
  const [rawIncomes, setRawIncomes] = useState<DashboardIncome[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const oldestTrendMonth = subMonths(selectedMonth, 5);
      const earliestDate = new Date(oldestTrendMonth.getFullYear(), oldestTrendMonth.getMonth(), 25, 0, 0, 0, 0);

      const { expenses, incomes } = await fetchDashboardTransactions(earliestDate);
      setRawExpenses(expenses);
      setRawIncomes(incomes);
    } catch (error) {
      if (error instanceof Error) toast.error("ดึงข้อมูลล้มเหลว: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Data Processing ---
  const processedData = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, { value: number; color: string }> = {};

    const ownerSummary: OwnerBreakdownData = {
      joint: { income: 0, expense: 0, transferIn: 0, transferOut: 0, balance: 0 },
      new: { income: 0, expense: 0, transferIn: 0, transferOut: 0, balance: 0 },
      save: { income: 0, expense: 0, transferIn: 0, transferOut: 0, balance: 0 },
    };

    const currentCycleStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 25, 0, 0, 0, 0);
    const currentCycleEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 24, 23, 59, 59, 999);

    rawIncomes.forEach((inc) => {
      const incDate = new Date(inc.created_at);
      if (incDate >= currentCycleStart && incDate <= currentCycleEnd) {
        const isTransfer = inc.note?.includes("รับเงินโอนจาก");

        if (!isTransfer) {
          totalIncome += Number(inc.amount);
        }
        
        const ownerKey = (inc.owner || "joint") as keyof OwnerBreakdownData;
        if (ownerSummary[ownerKey]) {
          if (isTransfer) {
            ownerSummary[ownerKey].transferIn += Number(inc.amount);
          } else {
            ownerSummary[ownerKey].income += Number(inc.amount);
          }
        }
      }
    });

    rawExpenses.forEach((exp) => {
      const expDate = new Date(exp.date);
      if (expDate >= currentCycleStart && expDate <= currentCycleEnd) {
        const isTransfer = exp.sub_category?.includes("โอนเงินไปที่");

        if (!isTransfer) {
          totalExpense += Number(exp.amount);
        }
        
        const ownerKey = (exp.owner || "joint") as keyof OwnerBreakdownData;
        if (ownerSummary[ownerKey]) {
          if (isTransfer) {
            ownerSummary[ownerKey].transferOut += Number(exp.amount);
          } else {
            ownerSummary[ownerKey].expense += Number(exp.amount);
          }
        }
        
        if (!isTransfer) {
          const catName = exp.transaction_categories?.name || LEGACY_LABELS[exp.category] || exp.category || "อื่นๆ";
          const catColor = exp.transaction_categories?.color || LEGACY_COLORS[exp.category] || "#f43f5e";
          if (!categoryTotals[catName]) categoryTotals[catName] = { value: 0, color: catColor };
          categoryTotals[catName].value += Number(exp.amount);
        }
      }
    });

    (Object.keys(ownerSummary) as Array<keyof OwnerBreakdownData>).forEach(key => {
      ownerSummary[key].balance = 
        (ownerSummary[key].income + ownerSummary[key].transferIn) - 
        (ownerSummary[key].expense + ownerSummary[key].transferOut);
    });

    const pieData = Object.entries(categoryTotals)
      .map(([name, data]) => ({ name, value: data.value, color: data.color }))
      .sort((a, b) => b.value - a.value);

    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = subMonths(selectedMonth, i);
      const mYear = targetMonth.getFullYear();
      const mMonth = targetMonth.getMonth();
      const monthLabel = format(targetMonth, "MMM", { locale: th });

      const cycleStart = new Date(mYear, mMonth, 25, 0, 0, 0, 0);
      const cycleEnd = new Date(mYear, mMonth + 1, 24, 23, 59, 59, 999);

      const mIncome = rawIncomes
        .filter((inc) => {
          const d = new Date(inc.created_at);
          const isTransfer = inc.note?.includes("รับเงินโอนจาก");
          return d >= cycleStart && d <= cycleEnd && !isTransfer;
        })
        .reduce((sum, inc) => sum + Number(inc.amount), 0);
        
      const mExpense = rawExpenses
        .filter((exp) => {
          const d = new Date(exp.date);
          const isTransfer = exp.sub_category?.includes("โอนเงินไปที่");
          return d >= cycleStart && d <= cycleEnd && !isTransfer;
        })
        .reduce((sum, exp) => sum + Number(exp.amount), 0);

      trendData.push({ month: monthLabel, income: mIncome, expense: mExpense });
    }

    return {
      summary: { income: totalIncome, expense: totalExpense, balance: totalIncome - totalExpense },
      ownerSummary,
      pieData,
      trendData,
      currentCycleStart,
      currentCycleEnd
    };
  }, [rawExpenses, rawIncomes, selectedMonth]);

  const handleMonthChange = (val: string) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(parseInt(val));
    setSelectedMonth(newDate);
  };

  const handleYearChange = (val: string) => {
    const newDate = new Date(selectedMonth);
    newDate.setFullYear(parseInt(val));
    setSelectedMonth(newDate);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ภาพรวมการเงิน</h1>
          <div className="flex items-center gap-2 mt-1">
            {isLoading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin"/> กำลังคำนวณข้อมูล...
              </p>
            ) : (
              <p className="text-sm text-primary font-medium flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-md">
                <CalendarIcon className="w-3.5 h-3.5" />
                รอบบิล: {format(processedData.currentCycleStart, "d MMM yy", { locale: th })} - {format(processedData.currentCycleEnd, "d MMM yy", { locale: th })}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedMonth.getMonth().toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-35 bg-card">
              <SelectValue placeholder="เลือกเดือน" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {format(new Date(2024, i, 1), "MMMM", { locale: th })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMonth.getFullYear().toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-25 bg-card">
              <SelectValue placeholder="เลือกปี" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }).map((_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return <SelectItem key={year} value={year.toString()}>{year + 543}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <SummaryCards 
        income={processedData.summary.income} 
        expense={processedData.summary.expense} 
        balance={processedData.summary.balance} 
      />

      <OwnerBreakdown data={processedData.ownerSummary} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ExpensePieChart data={processedData.pieData} isLoading={isLoading} />
        <TrendBarChart data={processedData.trendData} isLoading={isLoading} />
      </div>
    </div>
  );
}