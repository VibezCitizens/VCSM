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
  folder = 'inbox', // ✅ NEW
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
        folder, // ✅ NEW
      })

      // Flatten members + last message BEFORE modeling
      const modeled = raw
        .map((row) => {
          const lastMsg = row.last_message ?? row.lastMessage ?? null
          const lastMsgBody =
            typeof lastMsg?.body === 'string' ? lastMsg.body : null
          const lastMsgType = lastMsg?.message_type ?? lastMsg?.messageType ?? null

          const normalizedLastBody =
            lastMsgBody && lastMsgBody.trim().length > 0
              ? lastMsgBody
              : lastMsgType === 'image'
                ? '📷 Photo'
                : lastMsgType === 'video'
                  ? '🎥 Video'
                  : null

          return InboxEntryModel(
            {
              ...row,
              members: row.conversation?.members ?? [],

              // ✅ IMPORTANT: InboxEntryModel was reading the wrong key before.
              // We provide both snake_case and nested object so the model can pick it up.
              last_message_body: normalizedLastBody,
              last_message: lastMsg,
            },
            actorId // ✅ FIX: pass selfActorId
          )
        })
        .filter(Boolean)
        // ✅ ensure preview exists for CardInbox/buildInboxPreview even if body is null
        .map((e) => {
          const safePreview =
            (e.lastMessageBody && String(e.lastMessageBody).trim()) ||
            (e.unreadCount > 0 ? 'New message' : '')
          return { ...e, preview: safePreview }
        })

      // HARD FILTER — never resurrect hidden threads
      setEntries(modeled.filter((e) => !hiddenRef.current.has(e.conversationId)))
    } catch (err) {
      console.error('[useInbox] load failed', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [actorId, includeArchived, folder])

  /* ============================================================
     RESET on actor switch or folder change (CRITICAL)
     ============================================================ */
  useEffect(() => {
    hiddenRef.current.clear()
    setEntries([])
    setLoading(Boolean(actorId))
    setError(null)
  }, [actorId, folder])

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
