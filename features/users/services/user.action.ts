import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";

export async function fetchProfiles() {
  const supabase = createClient();
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw error;
  return data;
}

export async function getCurrentProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching current profile:", error);
    return null;
  }
  
  return data;
}

export async function createUser(data: { email: string; password: string; name: string }) {
  const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.name },
  });

  if (authError) throw authError;

  const { error: dbError } = await supabaseAdmin
    .from("users")
    .insert([{ id: userData.user!.id, email: data.email, name: data.name }]);

  if (dbError) throw dbError;
  return userData;
}

export async function updateProfile(userId: string, data: { name: string }) {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ name: data.name })
    .eq("id", userId);
  if (error) throw error;
  return true;
}

export async function deleteProfile(userId: string) {
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authError) throw authError;
  const { error: dbError } = await supabaseAdmin.from("users").delete().eq("id", userId);
  if (dbError) throw dbError;
}

export async function updateUserPassword(userId: string, newPassword: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
}
