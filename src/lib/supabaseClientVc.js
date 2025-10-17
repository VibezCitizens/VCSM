// src/lib/supabaseClientVc.js
import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseVc = createClient(url, anon, {
  db: { schema: 'vc' },   // <-- IMPORTANT: RPCs default to vc schema
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // keep storage consistent with your main client if you want the same debug logs:
    storage: window.localStorage,
    detectSessionInUrl: true,
  },
});

export default supabaseVc;
