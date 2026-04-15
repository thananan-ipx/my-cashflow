"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { User, UserRole } from "@/types";
import { revalidatePath } from "next/cache";

export async function fetchProfiles(): Promise<User[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return data as User[];
}

export async function getCurrentProfile(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching current user profile:", error);
    return null;
  }

  return data as User;
}

export async function updateProfile(userId: string, data: { name: string }) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ 
      name: data.name
    })
    .eq("id", userId);

  if (error) throw error;
  
  revalidatePath("/users");
}

/**
 * Creates a new user in both Auth and public.users table.
 * Uses supabaseAdmin (service role) to bypass sign-up restrictions.
 */
export async function createUser(data: { email: string; name: string; password?: string }) {
  // 1. Create user in Auth using Admin API
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password || "Password123!", // Default password if not provided
    email_confirm: true,
    user_metadata: { name: data.name }
  });

  if (authError) throw authError;

  // 2. Insert into public.users table (if no trigger exists)
  // According to your schema, users has id (uuid), email, name
  const { error: dbError } = await supabaseAdmin
    .from("users")
    .upsert({
      id: authUser.user.id,
      email: data.email,
      name: data.name,
    });

  if (dbError) throw dbError;
  
  revalidatePath("/users");
}

export async function deleteProfile(userId: string) {
  // Delete from Auth first (requires admin)
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authError) throw authError;

  // Delete from public.users (usually CASCADE if FK is set, but let's be safe)
  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (dbError) throw dbError;
  
  revalidatePath("/users");
}
