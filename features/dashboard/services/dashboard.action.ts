import { createClient } from "@/lib/supabase/client";

export interface DashboardExpense {
  id: number;
  amount: number;
  date: string;
  category: string;
  month: number;
  year: number;
  owner: string;
  transaction_categories?: { name: string; color: string } | null;
}

export interface DashboardIncome {
  id: number;
  amount: number;
  created_at: string;
  month: number;
  year: number;
  owner: string;
  transaction_categories?: { name: string; color: string } | null;
}

export async function fetchDashboardTransactions(earliestDate: Date) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่พบผู้ใช้งาน");

  const earliestDateStr = earliestDate.toISOString();
  const earliestDateOnly = earliestDateStr.split('T')[0];

  const [expensesRes, incomesRes] = await Promise.all([
    supabase
      .from("expenses")
      .select(`id, amount, date, category, month, year, owner, transaction_categories(name, color)`)
      .eq("user_id", user.id)
      .gte("date", earliestDateOnly),
    supabase
      .from("income")
      .select(`id, amount, created_at, month, year, owner, transaction_categories(name, color)`)
      .eq("user_id", user.id)
      .gte("created_at", earliestDateStr)
  ]);

  if (expensesRes.error) throw expensesRes.error;
  if (incomesRes.error) throw incomesRes.error;

  return {
    expenses: (expensesRes.data || []) as unknown as DashboardExpense[],
    incomes: (incomesRes.data || []) as unknown as DashboardIncome[],
  };
}