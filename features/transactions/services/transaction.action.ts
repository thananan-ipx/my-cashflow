// services/transaction.action.ts
import { createClient } from "@/lib/supabase/client";
import { Transaction } from "@/types";
import { format } from "date-fns";

export async function fetchTransactions(fromDate: string | null, toDate: string | null): Promise<Transaction[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่พบข้อมูลผู้ใช้");

  let expQuery = supabase.from("expenses").select(`*, transaction_categories(name, color)`).eq("user_id", user.id);
  if (fromDate && toDate) {
    expQuery = expQuery.gte("date", fromDate.split("T")[0]).lte("date", toDate.split("T")[0]);
  }
  const { data: expenses, error: expError } = await expQuery;
  if (expError) throw expError;

  let incQuery = supabase.from("income").select(`*, transaction_categories(name, color)`).eq("user_id", user.id);
  if (fromDate && toDate) {
    incQuery = incQuery.gte("created_at", fromDate).lte("created_at", toDate);
  }
  const { data: incomes, error: incError } = await incQuery;
  if (incError) throw incError;

  const formattedExpenses: Transaction[] = (expenses || []).map((e) => ({
    id: e.id, type: "expense", amount: Number(e.amount), category_id: e.category_id,
    category_name: e.transaction_categories?.name || e.category || "อื่นๆ",
    category_color: e.transaction_categories?.color || "#f43f5e",
    sub_category: e.sub_category, note: e.note || "", date: e.date, is_fixed: e.is_fixed,
    owner: e.owner || "joint"
  }));

  const formattedIncomes: Transaction[] = (incomes || []).map((i) => ({
    id: i.id, type: "income", amount: Number(i.amount), category_id: i.category_id,
    category_name: i.transaction_categories?.name || i.source || "อื่นๆ",
    category_color: i.transaction_categories?.color || "#10b981",
    note: i.note || "", date: format(new Date(i.created_at), "yyyy-MM-dd"), is_fixed: i.is_fixed,
    owner: i.owner || "joint"
  }));

  return [...formattedExpenses, ...formattedIncomes].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export async function addIncome(data: {
  amount: number; categoryId: number; formDate: Date; isFixed: boolean; note: string; owner: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่พบข้อมูลผู้ใช้");

  const { error } = await supabase.from("income").insert({
    user_id: user.id, amount: data.amount, category_id: data.categoryId,
    is_fixed: data.isFixed, month: data.formDate.getMonth() + 1, year: data.formDate.getFullYear(),
    note: data.note, created_at: data.formDate.toISOString(), owner: data.owner
  });

  if (error) throw error;
}

export async function addExpense(data: {
  amount: number; categoryId: number; subCategory: string; formDate: Date;
  isFixed: boolean; note: string; owner: string;
  debtId?: number; currentRemainingInstallments?: number | null; monthlyPayment?: number; debtName?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่พบข้อมูลผู้ใช้");

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id, amount: data.amount, category_id: data.categoryId,
    sub_category: data.subCategory, is_fixed: data.isFixed, date: format(data.formDate, "yyyy-MM-dd"),
    month: data.formDate.getMonth() + 1, year: data.formDate.getFullYear(), note: data.note,
    owner: data.owner
  });
  if (error) throw error;

  if (data.debtId && data.currentRemainingInstallments !== null && data.currentRemainingInstallments !== undefined && data.monthlyPayment) {
    const installmentsToDeduct = Math.max(1, Math.round(data.amount / data.monthlyPayment));
    const newRemaining = Math.max(0, data.currentRemainingInstallments - installmentsToDeduct);

    const { error: debtError } = await supabase.from("debts").update({
      remaining_installments: newRemaining,
      is_active: newRemaining > 0
    }).eq("id", data.debtId);

    if (debtError) throw debtError;
    return { isDebtPaidOff: newRemaining === 0, newRemaining, debtName: data.debtName };
  }
  
  return null;
}

export async function deleteTransaction(id: number, type: "income" | "expense") {
  const supabase = createClient();
  const table = type === "income" ? "income" : "expenses";
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function updateIncome(id: number, data: {
  amount: number; categoryId: number; formDate: Date; note: string; owner: string;
}) {
  const supabase = createClient();
  const { error } = await supabase.from("income").update({
    amount: data.amount,
    category_id: data.categoryId,
    month: data.formDate.getMonth() + 1,
    year: data.formDate.getFullYear(),
    note: data.note,
    created_at: data.formDate.toISOString(),
    owner: data.owner
  }).eq("id", id);

  if (error) throw error;
}

export async function updateExpense(id: number, data: {
  amount: number; categoryId: number; subCategory: string; formDate: Date; note: string; owner: string;
}) {
  const supabase = createClient();
  const { error } = await supabase.from("expenses").update({
    amount: data.amount,
    category_id: data.categoryId,
    sub_category: data.subCategory,
    date: format(data.formDate, "yyyy-MM-dd"),
    month: data.formDate.getMonth() + 1,
    year: data.formDate.getFullYear(),
    note: data.note,
    owner: data.owner
  }).eq("id", id);

  if (error) throw error;
}

export async function addTransfer(data: {
  amount: number;
  formDate: Date;
  fromOwner: string;
  toOwner: string;
  note: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่พบข้อมูลผู้ใช้");

  const { error: expError } = await supabase.from("expenses").insert({
    user_id: user.id,
    amount: data.amount,
    category_id: null,
    sub_category: `โอนเงินไปที่: ${data.toOwner}`,
    is_fixed: false,
    date: format(data.formDate, "yyyy-MM-dd"),
    month: data.formDate.getMonth() + 1,
    year: data.formDate.getFullYear(),
    note: data.note || "รายการโยกเงินระหว่างกระเป๋า",
    owner: data.fromOwner
  });

  if (expError) throw expError;

  const { error: incError } = await supabase.from("income").insert({
    user_id: user.id,
    amount: data.amount,
    category_id: null,
    is_fixed: false,
    month: data.formDate.getMonth() + 1,
    year: data.formDate.getFullYear(),
    note: data.note || `รับเงินโอนจาก: ${data.fromOwner}`,
    created_at: data.formDate.toISOString(),
    owner: data.toOwner
  });

  if (incError) throw incError;
}
