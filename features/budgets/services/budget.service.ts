// services/budget.service.ts
import { createClient } from "@/lib/supabase/client";
import { Budget, SavingGoal } from "@/types";

export async function fetchBudgetsSummary(month: number, year: number): Promise<Budget[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่พบผู้ใช้งาน");

  const { data: budgetData, error: budgetError } = await supabase
    .from("budgets")
    .select("*")
    // .eq("user_id", user.id)
    .eq("month", month)
    .eq("year", year);
  if (budgetError) throw budgetError;

  const { data: expenseData, error: expenseError } = await supabase
    .from("expenses")
    .select("category, amount")
    // .eq("user_id", user.id)
    .eq("month", month)
    .eq("year", year);
  if (expenseError) throw expenseError;

  const expensesByCategory = (expenseData || []).reduce<Record<string, number>>((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
    return acc;
  }, {});

  return (budgetData || []).map((b) => ({
    id: b.id,
    category: b.category,
    amount: Number(b.amount),
    spent: expensesByCategory[b.category] || 0,
    month: b.month,
    year: b.year,
  }));
}

export async function fetchSavingGoals(): Promise<SavingGoal[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่พบผู้ใช้งาน");

  const { data: goalsData, error: goalsError } = await supabase
    .from("saving_goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (goalsError) throw goalsError;

  return goalsData as SavingGoal[] || [];
}

export async function saveBudget(category: string, amount: number, month: number, year: number, existingId?: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่พบผู้ใช้งาน");

  if (existingId) {
    const { error } = await supabase.from("budgets").update({ amount }).eq("id", existingId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("budgets").insert({
      user_id: user.id,
      category,
      amount,
      month,
      year,
    });
    if (error) throw error;
  }
}

export async function createSavingGoal(name: string, targetAmount: number, currentAmount: number, targetDate: string | null) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่พบผู้ใช้งาน");

  const { error } = await supabase.from("saving_goals").insert({
    user_id: user.id,
    name,
    target_amount: targetAmount,
    current_amount: currentAmount,
    target_date: targetDate,
  });
  if (error) throw error;
}

export async function addFundsToGoal(goalId: number, currentAmount: number, addedAmount: number) {
  const supabase = createClient();
  const newAmount = currentAmount + addedAmount;
  const { error } = await supabase.from("saving_goals").update({ current_amount: newAmount }).eq("id", goalId);
  if (error) throw error;
  return newAmount;
}