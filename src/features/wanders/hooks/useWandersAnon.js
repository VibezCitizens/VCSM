// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\hooks\useWandersAnon.hook.js
// ============================================================================
// WANDERS HOOK — ANON IDENTITY
// Contract: UI lifecycle only. Calls controllers. No Supabase/DAL.
// Supports both default and named imports.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureWandersAnonIdentity } from '@/features/wanders/controllers/ensureWandersAnoncontroller'

export default function useWandersAnon(input = {}) {
  const { auto = true, touch = true } = input

  const [anon, setAnon] = useState(null)
  const [loading, setLoading] = useState(Boolean(auto))
  const [error, setError] = useState(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await ensureWandersAnonIdentity({ touch })
      if (!mountedRef.current) return null
      setAnon(res)
      return res
    } catch (e) {
      if (!mountedRef.current) return null
      setError(e)
      return null
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [touch])

  useEffect(() => {
    if (!auto) return
    refresh()
  }, [auto, refresh])

  return {
    anon,
    anonId: anon?.id ?? null,
    loading,
    error,
    refresh,
    ensureAnon: refresh,
  }
}

// Named export for screens that do: import { useWandersAnon } from "../hooks/useWandersAnon";
export { useWandersAnon }
