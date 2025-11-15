// src/lib/supabaseClientVc.js
import { createDebugClient } from './supabaseClient.debug';

const url  = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseVc = createDebugClient(url, anon, {
  db: { schema: 'vc' },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
    detectSessionInUrl: true,
  },
});

if (typeof window !== 'undefined') window.__sbVc = supabaseVc;

export default supabaseVc; // ⬅️ default export
