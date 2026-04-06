import { getWandersSupabase } from "@/features/wanders/services/wandersSupabaseClient";

export async function readWandersSessionUser() {
  const supabase = getWandersSupabase();
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;
  return data?.session?.user ?? null;
}

export async function ensureWandersGuestSessionUser() {
  const existingUser = await readWandersSessionUser();
  if (existingUser?.id) return existingUser;

  const supabase = getWandersSupabase();
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) throw error;

  const nextUser = data?.user ?? data?.session?.user ?? null;
  if (!nextUser?.id) {
    throw new Error("Guest sign-in failed: no user id returned.");
  }

  return nextUser;
}
