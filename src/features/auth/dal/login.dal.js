import { supabase } from "@/services/supabase/supabaseClient";

export async function dalSignInWithPassword({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function dalGetAuthUser() {
  return supabase.auth.getUser();
}

export async function dalSignOut() {
  return supabase.auth.signOut();
}
