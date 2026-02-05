// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\services\wandersSupabaseClient.js
import { createClient } from '@supabase/supabase-js'
import { getOrCreateWandersClientKey } from '@/features/wanders/lib/wandersClientKey'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '')
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Toggle verbose logging (set to "1" in .env.local if you want)
const DEBUG_WANDERS_SB = import.meta.env.VITE_DEBUG_WANDERS_SB === '1'

function dbg(...args) {
  if (DEBUG_WANDERS_SB) console.log('[WandersSupabase]', ...args)
}

function warn(...args) {
  console.warn('[WandersSupabase]', ...args)
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[WandersSupabase] Missing env vars', {
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

// Parse PostgREST error bodies when status indicates failure
async function tryReadJson(res) {
  try {
    const text = await res.clone().text()
    if (!text) return null
    return JSON.parse(text)
  } catch {
    return null
  }
}

// Small helper to identify schema allowlist failures quickly
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

    // If you ever see Accept: */* in devtools, force JSON to keep PostgREST happy.
    // This does not override more specific Accept headers supabase-js sets
    // (e.g. application/vnd.pgrst.object+json), because we only set if missing.
    if (!headers.has('accept')) headers.set('accept', 'application/json')

    // --- HARD BREAKPOINTS YOU CAN USE IN DEVTOOLS ---
    // 1) Break when calling wanders schema
    // eslint-disable-next-line no-debugger
    if (DEBUG_WANDERS_SB && url && url.includes('/rest/v1/')) debugger

    // 2) Break specifically for schema-profile routing issues
    const acceptProfile = headers.get('accept-profile')
    const contentProfile = headers.get('content-profile')
    if (DEBUG_WANDERS_SB && (acceptProfile === 'wanders' || contentProfile === 'wanders')) {
      // eslint-disable-next-line no-debugger
      debugger
    }

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
        x_client_key: headers.get('x-client-key'),
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
      body,
    })

    // Break immediately on PGRST106 so you can inspect headers + URL in scope.
    if (res.status === 406 && isPgrst106(body)) {
      warn('PGRST106 schema allowlist failure', {
        url,
        acceptProfile,
        contentProfile,
        message: body?.message,
      })
      // eslint-disable-next-line no-debugger
      debugger
    }

    return res
  }
}

export function getWandersSupabase() {
  const clientKey = getOrCreateWandersClientKey()

  // HMR-safe singleton by key
  const g = globalThis
  const existing = g.__WANDERS_SB__
  if (existing && existing.__clientKey === clientKey) {
    dbg('Reusing cached supabase client', { clientKey })
    return existing
  }

  dbg('Creating new supabase client', {
    url: SUPABASE_URL,
    anonKey_present: Boolean(SUPABASE_ANON_KEY),
    clientKey,
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
    },
  })

  Object.defineProperty(client, '__clientKey', { value: clientKey })
  g.__WANDERS_SB__ = client
  return client
}
