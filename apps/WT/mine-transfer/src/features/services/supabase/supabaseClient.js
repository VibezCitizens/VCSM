import { createClient } from '@supabase/supabase-js';
import { createDebugClient } from '@/services/supabase/supabaseClient.debug';

const url  = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('[Supabase] Missing env vars', {
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY_present: Boolean(anon),
  });
}

function readStorageFlag(key) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function shouldUseDebugClient() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEBUG_SUPABASE === '1') {
    return true;
  }

  return readStorageFlag('learning:debug:supabase') === '1';
}

function createConfiguredClient() {
  const factory = shouldUseDebugClient() ? createDebugClient : createClient;

  return factory(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,

      storageKey: 'sb-auth-main',
    },
  });
}

// 🔒 HMR-safe singleton: reuse across Vite hot reloads / multiple imports
function getOrCreateClient() {
  const g = globalThis;
  const mode = shouldUseDebugClient() ? 'debug' : 'standard';

  if (
    g.__SB_CLIENT__ &&
    g.__SB_CLIENT__.__isSingleton &&
    g.__SB_CLIENT_MODE__ === mode
  ) {
    return g.__SB_CLIENT__;
  }

  const client = createConfiguredClient();

  Object.defineProperty(client, '__isSingleton', { value: true });
  g.__SB_CLIENT__ = client;
  g.__SB_CLIENT_MODE__ = mode;

  // Optional dev convenience only (never expose in production)
  if (typeof window !== 'undefined' && import.meta.env.DEV && import.meta.env.VITE_EXPOSE_SB_CLIENT === '1') {
    window.__sb = client;
  }

  return client;
}

export const supabase = getOrCreateClient();
export default supabase;
