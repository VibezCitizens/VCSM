// src/features/chat/inbox/hooks/useInbox.js
// ============================================================
// useInbox
// ------------------------------------------------------------
// - Actor-scoped inbox hook
// - Handles load + realtime
// - Owns optimistic hide (NO FLASH)
// - Resurrection-safe
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'

import { getInboxEntries } from '@/features/chat/inbox/dal/inbox.read.dal'
import { InboxEntryModel } from '@/features/chat/inbox/model/InboxEntry.model'
import { subscribeToInbox } from '@/features/chat/inbox/realtime/subscribeToInbox'

export default function useInbox({
  actorId,
  includeArchived = false,
}) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const unsubRef = useRef(null)

  // ------------------------------------------------------------
  // Optimistic hide tombstones (conversationId set)
  // ------------------------------------------------------------
  const hiddenRef = useRef(new Set())

  /* ============================================================
     Load inbox for actor
     ============================================================ */
  const load = useCallback(async () => {
    if (!actorId) return

    setLoading(true)
    setError(null)

    try {
      const raw = await getInboxEntries({
        actorId,
        includeArchived,
      })

      // Flatten members BEFORE modeling
      const modeled = raw
        .map((row) =>
          InboxEntryModel({
            ...row,
            members: row.conversation?.members ?? [],
          })
        )
        .filter(Boolean)

      // HARD FILTER — never resurrect hidden threads
      setEntries(
        modeled.filter(
          (e) => !hiddenRef.current.has(e.conversationId)
        )
      )
    } catch (err) {
      console.error('[useInbox] load failed', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [actorId, includeArchived])

  /* ============================================================
     RESET on actor switch (CRITICAL)
     ============================================================ */
  useEffect(() => {
    hiddenRef.current.clear()
    setEntries([])
    setLoading(Boolean(actorId))
    setError(null)
  }, [actorId])

  /* ============================================================
     Realtime subscription (actor-scoped)
     ============================================================ */
  useEffect(() => {
    if (!actorId) return

    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }

    unsubRef.current = subscribeToInbox({
      actorId,
      onInboxChanged: load,
    })

    return () => {
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
    }
  }, [actorId, load])

  /* ============================================================
     Initial + refresh load
     ============================================================ */
  useEffect(() => {
    load()
  }, [load])

  /* ============================================================
     Optimistic hide (NO FLASH)
     ============================================================ */
  const hideConversation = useCallback((conversationId) => {
    if (!conversationId) return

    hiddenRef.current.add(conversationId)

    setEntries((prev) =>
      prev.filter((e) => e.conversationId !== conversationId)
    )
  }, [])

  return {
    entries,
    loading,
    error,
    refresh: load,
    hideConversation,
  }
}
