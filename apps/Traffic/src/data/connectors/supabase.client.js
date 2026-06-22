import { createClient } from "@supabase/supabase-js";

let _client = null;
let _adminClient = null;

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

/**
 * Server-only Supabase client for production static provider exports.
 * This is intentionally separate from getSupabaseClient() so public API DALs
 * cannot accidentally bypass RLS with the service role key.
 *
 * @returns {import("@supabase/supabase-js").SupabaseClient | null}
 */
export function getSupabaseAdminClient() {
  if (_adminClient) return _adminClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  _adminClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  return _adminClient;
}
