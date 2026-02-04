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

function withClientKeyFetch(clientKey) {
  return async (input, init = {}) => {
    const headers = new Headers(init.headers || {})
    headers.set('x-client-key', clientKey)
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
      // ✅ This is the reliable way: force header on every request
      fetch: withClientKeyFetch(clientKey),

      // (optional) doesn’t hurt; some internal calls may read this
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
