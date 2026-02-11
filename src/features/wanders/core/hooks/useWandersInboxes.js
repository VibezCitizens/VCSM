// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\hooks\useWandersInboxes.hook.js
// ============================================================================
// WANDERS HOOK — INBOXES (anon-first)
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createAnonWandersInbox,
  listMyWandersInboxesAsAnon,
  readWandersInboxById,
  readWandersInboxByPublicId,
  updateMyWandersInbox,
} from '@/features/wanders/controllers/wandersInboxescontroller'

export function useWandersInboxes(input = {}) {
  const { autoList = true, isActive = null, limit = 50 } = input

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(Boolean(autoList))
  const [error, setError] = useState(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const listMine = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listMyWandersInboxesAsAnon({ isActive, limit })
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
  }, [isActive, limit])

  useEffect(() => {
    if (!autoList) return
    listMine()
  }, [autoList, listMine])

  const createInbox = useCallback(async (payload) => {
    setError(null)
    const created = await createAnonWandersInbox(payload)
    // optimistic append at top
    setItems((prev) => [created, ...(prev ?? [])])
    return created
  }, [])

  const updateInbox = useCallback(async (payload) => {
    setError(null)
    const updated = await updateMyWandersInbox(payload)
    setItems((prev) => (prev ?? []).map((x) => (x.id === updated.id ? updated : x)))
    return updated
  }, [])

  const readById = useCallback(async (inboxId) => {
    setError(null)
    return readWandersInboxById({ inboxId })
  }, [])

  const readByPublicId = useCallback(async (publicId) => {
    setError(null)
    return readWandersInboxByPublicId({ publicId })
  }, [])

  return {
    inboxes: items,
    loading,
    error,
    listMine,
    createInbox,
    updateInbox,
    readById,
    readByPublicId,
  }
}
