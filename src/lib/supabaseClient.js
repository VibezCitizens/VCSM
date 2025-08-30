// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, ''); // strip trailing slash
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Don’t throw in dev — log loudly so you see it in the console
  console.error('[Supabase] Missing env vars', {
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY_present: Boolean(anon),
  });
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});
