// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\services\wandersSupabaseClient.js
import { createClient } from '@supabase/supabase-js'
import { getOrCreateWandersClientKey } from '@/features/wanders/lib/wandersClientKey'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '')
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const DEBUG_WANDERS_SB = import.meta.env.VITE_DEBUG_WANDERS_SB === '1'

// Dev-only debug logging. Never emits in production builds, and callers below
// must pass only non-sensitive metadata (presence booleans, status codes) —
// never raw client keys, auth tokens, or response bodies.
function dbg(...args) {
  if (DEBUG_WANDERS_SB && import.meta.env.DEV) console.log('[WandersSupabase]', ...args)
}

function warn(...args) {
  if (import.meta.env.DEV) console.warn('[WandersSupabase]', ...args)
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (import.meta.env.DEV) console.error('[WandersSupabase] Missing env vars', {
    VITE_SUPABASE_URL_present: Boolean(SUPABASE_URL),
    VITE_SUPABASE_ANON_KEY_present: Boolean(SUPABASE_ANON_KEY),
  })
}

// Safe header merge: preserves existing headers from both Request + init
function mergeHeaders(input, initHeaders) {
  const base =
    typeof Request !== 'undefined' && input instanceof Request
      ? new Headers(input.headers)
      : new Headers()

  if (initHeaders) {
    const h = initHeaders instanceof Headers ? initHeaders : new Headers(initHeaders)
    h.forEach((value, key) => base.set(key, value))
  }

  return base
}

async function tryReadJson(res) {
  try {
    const text = await res.clone().text()
    if (!text) return null
    return JSON.parse(text)
  } catch {
    return null
  }
}

function isPgrst106(body) {
  return body && body.code === 'PGRST106'
}

function withClientKeyFetch(clientKey) {
  return async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url
    const method =
      init?.method ||
      (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')

    const headers = mergeHeaders(input, init.headers)
    headers.set('x-client-key', clientKey)

    if (!headers.has('accept')) headers.set('accept', 'application/json')

    const acceptProfile = headers.get('accept-profile')
    const contentProfile = headers.get('content-profile')

    if (DEBUG_WANDERS_SB) {
      dbg('REQUEST', {
        method,
        url,
        accept: headers.get('accept'),
        acceptProfile,
        contentProfile,
        apikey_present: Boolean(headers.get('apikey')),
        authorization_present: Boolean(headers.get('authorization')),
        x_client_info: headers.get('x-client-info'),
        // Never log the raw client key — presence only.
        x_client_key_present: Boolean(headers.get('x-client-key')),
      })
    }

    const res = await fetch(input, { ...init, headers })

    if (!DEBUG_WANDERS_SB) return res

    const body = await tryReadJson(res)

    dbg('RESPONSE', {
      method,
      url,
      status: res.status,
      statusText: res.statusText,
      sb_request_id: res.headers.get('sb-request-id'),
      sb_gateway_version: res.headers.get('sb-gateway-version'),
      content_type: res.headers.get('content-type'),
      // Response body may contain user data — log only the PostgREST error code.
      body_code: body?.code ?? null,
    })

    if (res.status === 406 && isPgrst106(body)) {
      warn('PGRST106 schema allowlist failure', {
        url,
        acceptProfile,
        contentProfile,
      })
    }

    return res
  }
}

// Module-scoped singleton — intentionally not on globalThis/window
// (globalThis exposes auth client to XSS; module scope does not)
let _wandersClient = null
let _wandersClientKey = null
let _wandersStorageKey = null

export function getWandersSupabase() {
  const clientKey = getOrCreateWandersClientKey()

  // ✅ isolate auth storage per clientKey (guest identity per device)
  const storageKey = `sb-auth-wanders-${clientKey}`

  if (_wandersClient && _wandersClientKey === clientKey && _wandersStorageKey === storageKey) {
    dbg('Reusing cached supabase client', { clientKey, storageKey })
    return _wandersClient
  }

  dbg('Creating new supabase client', {
    url: SUPABASE_URL,
    anonKey_present: Boolean(SUPABASE_ANON_KEY),
    clientKey,
    storageKey,
  })

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      fetch: withClientKeyFetch(clientKey),
      headers: {
        'x-client-key': clientKey,
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,

      // ✅ auth persisted by storageKey in localStorage — survives module resets on HMR
      storageKey,
    },
  })

  _wandersClient = client
  _wandersClientKey = clientKey
  _wandersStorageKey = storageKey
  return client
}
