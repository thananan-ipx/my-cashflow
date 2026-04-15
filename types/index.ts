export interface Category {
  id: number;
  type: "income" | "expense";
  name: string;
  color: string;
  user_id?: string;
}

export interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  category_id?: number | null;
  category_name: string;
  category_color: string;
  sub_category?: string;
  note: string;
  date: string;
  is_fixed: boolean;
  owner: string;
  slip_url?: string | null;
}

export interface Budget {
  id: number;
  category: string;
  amount: number;
  spent?: number;
  month?: number;
  year?: number;
}

export interface SavingGoal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
}

export interface Debt {
  id: number;
  name: string;
  total_amount: number;
  monthly_payment: number;
  remaining_installments: number | null;
  start_date: string | null;
  interest_rate: number | null;
  is_active?: boolean;
}

export interface ExpenseRecord {
  id: number;
  amount: number;
  category: string;
  category_id?: number;
  sub_category?: string;
  note?: string;
  date: string;
  is_fixed: boolean;
  owner?: string;
  transaction_categories?: { name: string; color: string };
  slip_url?: string | null;
}

export type UserRole = "admin" | "member" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role?: UserRole; // Role is not in schema but we keep it for app logic if needed
  created_at: string;
}
