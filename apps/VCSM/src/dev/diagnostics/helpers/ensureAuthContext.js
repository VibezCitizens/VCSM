import { supabase } from "@/services/supabase/supabaseClient";

export async function ensureAuthContext(shared) {
  if (shared?.cache?.authContext) {
    return shared.cache.authContext;
  }

  const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] =
    await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);

  if (sessionError) throw sessionError;
  if (userError) throw userError;

  const session = sessionData?.session ?? null;
  const user = userData?.user ?? null;

  if (!user?.id) {
    throw new Error(
      "No authenticated user found. Log in first, then rerun diagnostics at /dev/diagnostics."
    );
  }

  const authContext = {
    user,
    session,
    userId: user.id,
    email: user.email ?? null,
  };

  if (shared?.cache) {
    shared.cache.authContext = authContext;
  }

  return authContext;
}
