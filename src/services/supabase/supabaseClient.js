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
      // default localStorage is used internally
    },
  });

  Object.defineProperty(client, '__isSingleton', { value: true });
  g.__SB_CLIENT__ = client;

  // Optional dev convenience (safe to remove if you want zero globals)
  if (typeof window !== 'undefined') {
    window.__sb = client;
  }

  return client;
}

export const supabase = getOrCreateClient();
export default supabase;
