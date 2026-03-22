"use client";

import React, { useState, useEffect } from "react";
import { format, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { th } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle, Wallet, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const legacyLabels: Record<string, string> = {
  food: "อาหาร/ของใช้", car: "รถยนต์/เดินทาง", rent: "ค่าที่พัก/บ้าน", debt: "ชำระหนี้",
  subscription: "บริการรายเดือน", utility: "ค่าน้ำ/ค่าไฟ/เน็ต", other: "อื่นๆ",
};
const legacyColors: Record<string, string> = {
  food: "#f59e0b", car: "#3b82f6", rent: "#8b5cf6", debt: "#ef4444",
  subscription: "#ec4899", utility: "#06b6d4", other: "#94a3b8",
};

export default function DashboardPage() {
  const supabase = createClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [summaryData, setSummaryData] = useState({ income: 0, expense: 0, balance: 0 });
  const [expenseByCategory, setExpenseByCategory] = useState<{ name: string; value: number; color: string }[]>([]);
  const [sixMonthsTrend, setSixMonthsTrend] = useState<{ month: string; income: number; expense: number }[]>([]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

      // Join categories มาด้วยเลยเพื่อความรวดเร็ว
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select(`*, transaction_categories(name, color)`)
        .eq("user_id", user.id)
        .gte("date", format(sixMonthsAgo, "yyyy-MM-dd"));
      if (expensesError) throw expensesError;

      const { data: incomes, error: incomesError } = await supabase
        .from("income")
        .select(`*, transaction_categories(name, color)`)
        .eq("user_id", user.id)
        .gte("created_at", sixMonthsAgo.toISOString());
      if (incomesError) throw incomesError;

      const fromDate = date?.from ? startOfDay(date.from) : startOfMonth(new Date());
      const toDate = date?.to ? endOfDay(date.to) : endOfDay(new Date());

      let totalIncome = 0;
      let totalExpense = 0;
      const categoryTotals: Record<string, { value: number; color: string }> = {};

      (incomes || []).forEach((inc: any) => {
        const incDate = new Date(inc.created_at);
        if (incDate >= fromDate && incDate <= toDate) {
          totalIncome += Number(inc.amount);
        }
      });

      (expenses || []).forEach((exp: any) => {
        const expDate = new Date(exp.date);
        if (expDate >= fromDate && expDate <= toDate) {
          totalExpense += Number(exp.amount);
          
          // ดึงชื่อและสีที่จัดกลุ่ม
          const catName = exp.transaction_categories?.name || legacyLabels[exp.category] || exp.category || "อื่นๆ";
          const catColor = exp.transaction_categories?.color || legacyColors[exp.category] || "#f43f5e";
          
          if (!categoryTotals[catName]) {
            categoryTotals[catName] = { value: 0, color: catColor };
          }
          categoryTotals[catName].value += Number(exp.amount);
        }
      });

      setSummaryData({
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
      });

      const pieData = Object.entries(categoryTotals)
        .map(([name, data]) => ({
          name: name,
          value: data.value,
          color: data.color,
        }))
        .sort((a, b) => b.value - a.value);
        
      setExpenseByCategory(pieData);

      const trendData = [];
      for (let i = 5; i >= 0; i--) {
        const targetMonth = subMonths(new Date(), i);
        const m = targetMonth.getMonth() + 1;
        const y = targetMonth.getFullYear();
        const monthLabel = format(targetMonth, "MMM", { locale: th });

        const mIncome = (incomes || [])
          .filter((inc) => inc.month === m && inc.year === y)
          .reduce((sum, inc) => sum + Number(inc.amount), 0);
          
        const mExpense = (expenses || [])
          .filter((exp) => exp.month === m && exp.year === y)
          .reduce((sum, exp) => sum + Number(exp.amount), 0);

        trendData.push({
          month: monthLabel,
          income: mIncome,
          expense: mExpense,
        });
      }
      setSixMonthsTrend(trendData);

    } catch (error: any) {
      toast.error("ดึงข้อมูลล้มเหลว: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [date]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ภาพรวมการเงิน</h1>
          {isLoading && <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><Loader2 className="w-3 h-3 animate-spin"/> กำลังคำนวณข้อมูล...</p>}
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal bg-card", !date && "text-muted-foreground")}>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">รายรับรวม</CardTitle>
            <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              ฿{summaryData.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">ตามช่วงเวลาที่เลือก</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">รายจ่ายรวม</CardTitle>
            <ArrowDownCircle className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">
              ฿{summaryData.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">ตามช่วงเวลาที่เลือก</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">ยอดคงเหลือ (Balance)</CardTitle>
            <Wallet className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", summaryData.balance >= 0 ? "text-blue-500" : "text-rose-500")}>
              ฿{summaryData.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryData.balance >= 0 ? "สามารถนำไปออมเพิ่มได้" : "รายจ่ายมากกว่ารายรับ"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>สัดส่วนรายจ่ายตามช่วงเวลา</CardTitle></CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {expenseByCategory.length === 0 && !isLoading ? (
              <p className="text-muted-foreground text-sm">ไม่มีข้อมูลรายจ่ายในช่วงเวลานี้</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>รายรับ vs รายจ่าย (6 เดือนย้อนหลัง)</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
             {sixMonthsTrend.every(t => t.income === 0 && t.expense === 0) && !isLoading ? (
               <div className="w-full h-full flex items-center justify-center"><p className="text-muted-foreground text-sm">ยังไม่มีข้อมูลเพียงพอ</p></div>
             ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sixMonthsTrend} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `฿${value / 1000}k`} />
                  <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} cursor={{ fill: 'transparent' }} />
                  <Legend />
                  <Bar dataKey="income" name="รายรับ" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="รายจ่าย" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}