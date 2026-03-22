import { createClient } from "@/lib/supabase/client";
import { Category } from "@/types";

export async function fetchCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่พบข้อมูลผู้ใช้");

  const { data, error } = await supabase
    .from("transaction_categories")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as Category[]) || [];
}

export async function createCategory(type: "income" | "expense", name: string, color: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่พบข้อมูลผู้ใช้");

  const { error } = await supabase.from("transaction_categories").insert({
    user_id: user.id,
    type,
    name,
    color,
  });

  if (error) throw error;
}

export async function deleteCategory(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("transaction_categories").delete().eq("id", id);
  if (error) throw error;
}