import { supabase } from "@/services/supabase/supabaseClient";

export async function readAuthedUserDAL() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user ?? null;
}
