import { supabase } from "@/services/supabase/supabaseClient";

export async function readSupabaseSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data?.session ?? null;
}

export async function readSupabaseAccessToken() {
  const session = await readSupabaseSession();
  return session?.access_token ?? null;
}
