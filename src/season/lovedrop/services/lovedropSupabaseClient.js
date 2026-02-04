// src/season/lovedrop/services/lovedropSupabaseClient.js
import { createClient } from '@supabase/supabase-js'
import { getOrCreateLovedropClientKey } from '@/season/lovedrop/lib/lovedropClientKey'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '')
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[LovedropSupabase] Missing env vars', {
    VITE_SUPABASE_URL_present: Boolean(SUPABASE_URL),
    VITE_SUPABASE_ANON_KEY_present: Boolean(SUPABASE_ANON_KEY),
  })
}

function mergeHeaders(input, initHeaders) {
  // 1) Start with headers from Request (if input is Request)
  const base =
    typeof Request !== 'undefined' && input instanceof Request
      ? new Headers(input.headers)
      : new Headers()

  // 2) Merge init.headers on top
  if (initHeaders) {
    const h = initHeaders instanceof Headers ? initHeaders : new Headers(initHeaders)
    h.forEach((value, key) => base.set(key, value))
  }

  return base
}

function withClientKeyFetch(clientKey) {
  return async (input, init = {}) => {
    const headers = mergeHeaders(input, init.headers)

    // ✅ Keep existing headers (incl Content-Profile / Accept-Profile), just add ours
    headers.set('x-client-key', clientKey)

    // If input is a Request, clone it with merged headers so we don't lose anything
    if (typeof Request !== 'undefined' && input instanceof Request) {
      const req = new Request(input, { ...init, headers })
      return fetch(req)
    }

    return fetch(input, { ...init, headers })
  }
}

export function getLovedropSupabase() {
  const clientKey = getOrCreateLovedropClientKey()

  // HMR-safe singleton by key
  const g = globalThis
  const existing = g.__LOVEDROP_SB__
  if (existing && existing.__clientKey === clientKey) return existing

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      fetch: withClientKeyFetch(clientKey),

      // optional; fine to keep
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
  g.__LOVEDROP_SB__ = client
  return client
}
