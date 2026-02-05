// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\hooks\useWandersMailbox.hook.js
// ============================================================================
// WANDERS HOOK — MAILBOX (anon-first)
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  listMyMailboxAsAnon,
  markMailboxItemRead,
  updateMailboxItem,
} from '@/features/wanders/controllers/wandersMailboxcontroller'

export function useWandersMailbox(input = {}) {
  const { auto = true, folder = null, ownerRole = null, limit = 50 } = input

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(Boolean(auto))
  const [error, setError] = useState(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refresh = useCallback(async (override = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await listMyMailboxAsAnon({
        folder: override.folder ?? folder,
        ownerRole: override.ownerRole ?? ownerRole,
        limit: override.limit ?? limit,
      })
      if (!mountedRef.current) return []
      setItems(res)
      return res
    } catch (e) {
      if (!mountedRef.current) return []
      setError(e)
      return []
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [folder, ownerRole, limit])

  useEffect(() => {
    if (!auto) return
    refresh()
  }, [auto, refresh])

  const markRead = useCallback(async (itemId, isRead = true) => {
    setError(null)
    const updated = await markMailboxItemRead({ itemId, isRead })
    setItems((prev) => (prev ?? []).map((x) => (x.id === updated.id ? updated : x)))
    return updated
  }, [])

  const updateItem = useCallback(async (payload) => {
    setError(null)
    const updated = await updateMailboxItem(payload)
    setItems((prev) => (prev ?? []).map((x) => (x.id === updated.id ? updated : x)))
    return updated
  }, [])

  return {
    items,
    loading,
    error,
    refresh,
    markRead,
    updateItem,
  }
}
