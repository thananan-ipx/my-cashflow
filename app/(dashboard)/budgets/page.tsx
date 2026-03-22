// app/(dashboard)/budgets/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Budget, SavingGoal } from "@/types";
import { fetchBudgetsSummary, fetchSavingGoals } from "@/features/budgets/services/budget.service";

// นำเข้า Components ที่เราเพิ่งแยกออกไป
import { BudgetTab } from "@/features/budgets/components/BudgetTab";
import { SavingGoalTab } from "@/features/budgets/components/SavingGoalTab";

export default function BudgetsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // สามารถใช้ Promise.all เพื่อให้ดึงข้อมูลพร้อมกัน (เร็วกว่าเดิม)
      const [budgetsData, goalsData] = await Promise.all([
        fetchBudgetsSummary(currentMonth, currentYear),
        fetchSavingGoals()
      ]);
      setBudgets(budgetsData);
      setSavingGoals(goalsData);
    } catch (error) {
      if (error instanceof Error) toast.error("ดึงข้อมูลล้มเหลว: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">งบประมาณ & การออม</h1>
        <p className="text-muted-foreground mt-2">
          ควบคุมค่าใช้จ่ายประจำเดือน {format(currentDate, "MMMM yyyy", { locale: th })} และติดตามเป้าหมายของคุณ
        </p>
      </div>

      <Tabs defaultValue="budgets" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="budgets">งบประมาณเดือนนี้</TabsTrigger>
          <TabsTrigger value="savings">เป้าหมายการออม</TabsTrigger>
        </TabsList>

        <TabsContent value="budgets">
          <BudgetTab 
            budgets={budgets} 
            isLoading={isLoading} 
            currentMonth={currentMonth} 
            currentYear={currentYear}
            onRefresh={loadData} 
          />
        </TabsContent>

        <TabsContent value="savings">
          <SavingGoalTab 
            savingGoals={savingGoals} 
            isLoading={isLoading} 
            onRefresh={loadData} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}