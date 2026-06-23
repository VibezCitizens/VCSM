import { createClient } from "@supabase/supabase-js";

// Shared browser/anon Supabase client for public Answers reads + the public
// answer-submission RPC. Works in the browser at runtime and in Node at build
// time (NEXT_PUBLIC_* are inlined in both). Never uses service-role keys.

let cachedClient = null;

export function getAnswersAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  if (cachedClient) return cachedClient;

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `sb-traze-answers-detail-${url.slice(-8)}`
    }
  });

  return cachedClient;
}
