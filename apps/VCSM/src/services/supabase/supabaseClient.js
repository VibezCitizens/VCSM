// src/services/supabase/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('[Supabase] Missing env vars', {
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY_present: Boolean(anon),
  });
}

// 🔒 HMR-safe singleton: reuse across Vite hot reloads / multiple imports
function getOrCreateClient() {
  const g = globalThis;
  if (g.__SB_CLIENT__ && g.__SB_CLIENT__.__isSingleton) {
    return g.__SB_CLIENT__;
  }

  const client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,

      // ✅ IMPORTANT: isolate main-app auth from Wanders auth
      storageKey: 'sb-auth-main',
      // default localStorage is used internally
    },
  });

  Object.defineProperty(client, '__isSingleton', { value: true });
  g.__SB_CLIENT__ = client;

  return client;
}

export const supabase = getOrCreateClient();
export default supabase;

// DEV-ONLY: Install performance instrumentation on the Supabase client.
// This wraps .from(), .schema().from(), and .rpc() to capture query timing.
if (import.meta.env.DEV) {
  import('@debuggers/performance/instrumentation/supabaseProxy.js').then(({ installSupabaseProxy }) => {
    installSupabaseProxy(supabase);
  });
}
