// src/services/supabase/supabaseClient'; //transfer.js
import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('[Supabase] Missing env vars', {
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY_present: Boolean(anon),
  });
}

/**
 * Debug storage that logs only when values CHANGE to avoid console floods.
 * Still shows the first read/write per key, then suppresses identical repeats.
 */
const makeDebugStorage = () => {
  const seen = new Map(); // k -> signature of last value (length + head)
  const getSig = (v) => {
    if (v == null) return 'null';
    // tiny signature: length + first 24 chars (enough to notice refresh)
    return `${v.length}:${v.slice(0, 24)}`;
  };

  const safeLocal = (typeof window !== 'undefined' && window.localStorage)
    ? window.localStorage
    : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      };

  return {
    getItem: (k) => {
      const v = safeLocal.getItem(k);
      const sig = getSig(v);
      if (seen.get(k) !== sig) {
        console.log('[auth.storage.getItem]', k, '=>', v?.slice?.(0, 80) ?? v);
        seen.set(k, sig);
      }
      return v;
    },
    setItem: (k, v) => {
      console.log('[auth.storage.setItem]', k, 'len=', v?.length ?? 0);
      seen.set(k, getSig(v));
      return safeLocal.setItem(k, v);
    },
    removeItem: (k) => {
      console.log('[auth.storage.removeItem]', k);
      seen.delete(k);
      return safeLocal.removeItem(k);
    },
  };
};

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
      storage: makeDebugStorage(),   // keep logs, but dedup spam
      detectSessionInUrl: true,
    },
  });

  // tag + expose for dev tools & HMR reuse
  Object.defineProperty(client, '__isSingleton', { value: true });
  g.__SB_CLIENT__ = client;
  // Keep your original dev handle too
  if (typeof window !== 'undefined') {
    window.__sb = client;
  }
  console.log('[Supabase] client ready', { url });

  return client;
}

export const supabase = getOrCreateClient();
export default supabase;
