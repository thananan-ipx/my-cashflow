import { createClient } from "@/lib/supabase/client";
import { Debt } from "@/types";

export async function fetchDebts(): Promise<Debt[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่พบผู้ใช้งาน");

  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Debt[]) || [];
}

export async function createDebt(
  name: string,
  totalAmount: number,
  monthlyPayment: number,
  remainingInstallments: number | null,
  interestRate: number | null
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่พบผู้ใช้งาน");

  const { error } = await supabase.from("debts").insert({
    user_id: user.id,
    name,
    total_amount: totalAmount,
    monthly_payment: monthlyPayment,
    remaining_installments: remainingInstallments,
    interest_rate: interestRate,
    is_active: true,
  });

  if (error) throw error;
}