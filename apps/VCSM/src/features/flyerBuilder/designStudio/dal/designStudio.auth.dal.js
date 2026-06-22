import { supabase } from "@/services/supabase/supabaseClient";

export async function dalReadAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id || null;
}
