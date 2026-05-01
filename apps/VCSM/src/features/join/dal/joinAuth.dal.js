import { supabase } from "@/services/supabase/supabaseClient";

export async function signUpForInviteDAL({ email, password, emailRedirectTo, metadata }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo, data: metadata },
  });
  if (error) throw error;
  return data;
}
