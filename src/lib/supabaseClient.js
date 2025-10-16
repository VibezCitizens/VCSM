// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('[Supabase] Missing env vars', {
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY_present: Boolean(anon),
  });
}

// 🔍 Wrap localStorage to log everything supabase tries to persist/read
const debugStorage = {
  getItem: (k) => {
    const v = window.localStorage.getItem(k);
    console.log('[auth.storage.getItem]', k, '=>', v?.slice?.(0, 80) ?? v);
    return v;
  },
  setItem: (k, v) => {
    console.log('[auth.storage.setItem]', k, 'len=', v?.length ?? 0);
    return window.localStorage.setItem(k, v);
  },
  removeItem: (k) => {
    console.log('[auth.storage.removeItem]', k);
    return window.localStorage.removeItem(k);
  },
};

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: debugStorage,      // 👈 force + log localStorage ops
    detectSessionInUrl: true,
  },
});

// Make it easy to poke in console
window.__sb = supabase;
console.log('[Supabase] client ready', { url });

export default supabase;