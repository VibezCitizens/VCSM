import { createClient } from "@supabase/supabase-js";

let _client = null;

/**
 * Public Supabase client for Traffic reads and writes that must respect RLS.
 *
 * @returns {import("@supabase/supabase-js").SupabaseClient | null}
 */
export function getSupabaseClient() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  _client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  return _client;
}
