// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\hooks\useWandersCards.hook.js
// ============================================================================
// WANDERS HOOK — CARDS
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  listCardsForInbox,
  markWandersCardOpened,
  readWandersCardById,
  readWandersCardByPublicId,
  sendWandersCardToInbox,
} from '@/features/wanders/controllers/wandersCardscontroller'

export function useWandersCards(input = {}) {
  const { inboxId = null, autoList = false, limit = 50 } = input

  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(Boolean(autoList))
  const [error, setError] = useState(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const listForInbox = useCallback(async (override = {}) => {
    if (!inboxId && !override.inboxId) return []
    const targetInboxId = override.inboxId ?? inboxId

    setLoading(true)
    setError(null)
    try {
      const res = await listCardsForInbox({
        inboxId: targetInboxId,
        limit: override.limit ?? limit,
      })
      if (!mountedRef.current) return []
      setCards(res)
      return res
    } catch (e) {
      if (!mountedRef.current) return []
      setError(e)
      return []
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [inboxId, limit])

  useEffect(() => {
    if (!autoList) return
    if (!inboxId) return
    listForInbox()
  }, [autoList, inboxId, listForInbox])

  const sendToInbox = useCallback(async (payload) => {
    setError(null)
    const created = await sendWandersCardToInbox(payload)
    // optimistic prepend if we are currently viewing the same inbox
    if (created?.inboxId && created.inboxId === inboxId) {
      setCards((prev) => [created, ...(prev ?? [])])
    }
    return created
  }, [inboxId])

  const readById = useCallback(async (cardId) => {
    setError(null)
    return readWandersCardById({ cardId })
  }, [])

  const readByPublicId = useCallback(async (publicId) => {
    setError(null)
    return readWandersCardByPublicId({ publicId })
  }, [])

  const markOpened = useCallback(async (cardId) => {
    setError(null)

    let updated = null
    try {
      updated = await markWandersCardOpened({ cardId })
    } catch (e) {
      setError(e)
      return null
    }

    // RLS/public link can cause "no rows updated" => controller may return null
    if (!updated?.id) return updated ?? null

    setCards((prev) => (prev ?? []).map((c) => (c.id === updated.id ? updated : c)))
    return updated
  }, [])

  return {
    cards,
    loading,
    error,
    listForInbox,
    sendToInbox,
    readById,
    readByPublicId,
    markOpened,
  }
}
