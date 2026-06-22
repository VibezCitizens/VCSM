// src/services/supabase/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// 🔒 HMR-safe singleton: reuse across Vite hot reloads / multiple imports
// Module-scoped ref — intentionally not on globalThis/window (globalThis exposes auth client to XSS).
let _client = null

// Lazy construction: the real Supabase client is built on first use, never at
// module-import time. Importing this module (e.g. transitively via monitoring
// from a controller) must not require VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
// to be present. Missing config only surfaces when a DB path is actually used.
function getOrCreateClient() {
  if (_client) return _client

  const url  = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    console.error('[Supabase] Missing env vars', {
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_ANON_KEY_present: Boolean(anon),
    });
  }

  _client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,

      // ✅ IMPORTANT: isolate main-app auth from Wanders auth
      storageKey: 'sb-auth-main',
      // default localStorage is used internally
    },
  })

  // DEV-ONLY: Install performance instrumentation on the Supabase client.
  // This wraps .from(), .schema().from(), and .rpc() to capture query timing.
  // Runs once, immediately after the client is first constructed.
  if (import.meta.env.DEV) {
    import('@debuggers/performance/instrumentation/supabaseProxy.js').then(({ installSupabaseProxy }) => {
      installSupabaseProxy(_client);
    });
  }

  return _client
}

// Public surface is unchanged: callers still `import supabase` / `import { supabase }`
// and use `supabase.from(...)`, `.rpc(...)`, `.auth`, `.functions.invoke(...)`, etc.
// The Proxy forwards every access to the lazily-created client and binds methods to
// it so `this` is preserved at the call site.
const lazyClientHandler = {
  get(_target, prop, receiver) {
    const client = getOrCreateClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
  set(_target, prop, value) {
    return Reflect.set(getOrCreateClient(), prop, value)
  },
  has(_target, prop) {
    return prop in getOrCreateClient()
  },
}

export const supabase = new Proxy({}, lazyClientHandler);
export default supabase;

// Lazy schema-scoped client factory. Mirrors the lazy behavior above so that
// `supabase.schema('vc' | 'vport' | 'reviews')` is only invoked on first real
// use, never at module import. Schema client modules use this instead of calling
// `supabase.schema(...)` eagerly.
export function createLazySchemaClient(schemaName) {
  let scoped = null
  const resolve = () => (scoped ??= getOrCreateClient().schema(schemaName))
  return new Proxy({}, {
    get(_target, prop) {
      const client = resolve()
      const value = Reflect.get(client, prop, client)
      return typeof value === 'function' ? value.bind(client) : value
    },
    set(_target, prop, value) {
      return Reflect.set(resolve(), prop, value)
    },
    has(_target, prop) {
      return prop in resolve()
    },
  })
}
