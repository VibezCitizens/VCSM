import { createClient } from "@supabase/supabase-js";

let _client = null;
let _adminClient = null;

/**
 * Returns a Supabase anon client for build-time / server-side reads.
 * Returns null if SUPABASE_URL or SUPABASE_ANON_KEY are not set —
 * callers receive empty arrays and degrade to notFound().
 *
 * Never call this in client components — the anon key is fine for public
 * reads but env vars without NEXT_PUBLIC_ prefix are server-only.
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
