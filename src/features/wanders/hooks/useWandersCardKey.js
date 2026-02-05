// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\hooks\useWandersCardKey.hook.js
// ============================================================================
// WANDERS HOOK — CARD KEY
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { readWandersCardKey, upsertWandersCardKey } from '@/features/wanders/controllers/wandersCardKeys.controller'

export function useWandersCardKey(input) {
  const { cardId, auto = false } = input || {}
  if (!cardId) throw new Error('useWandersCardKey requires { cardId }')

  const [cardKey, setCardKey] = useState(null)
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
      const res = await readWandersCardKey({ cardId })
      if (!mountedRef.current) return null
      setCardKey(res)
      return res
    } catch (e) {
      if (!mountedRef.current) return null
      setError(e)
      return null
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [cardId])

  useEffect(() => {
    if (!auto) return
    refresh()
  }, [auto, refresh])

  const upsert = useCallback(async (payload) => {
    setError(null)
    const res = await upsertWandersCardKey({ cardId, ...payload })
    setCardKey(res)
    return res
  }, [cardId])

  return {
    cardKey,
    loading,
    error,
    refresh,
    upsert,
  }
}
