// src/features/moderation/hooks/useConversationCover.js
// ============================================================
// Hook: conversation cover
// - Answers: "When should this run and how should UI respond?"
// - Owns: hydration + undo + local covered state
// ============================================================

import { useEffect, useState, useCallback } from 'react'
import { getConversationCoverStatus } from '../controllers/getConversationCoverStatus.controller'
import { undoConversationCover } from '../controllers/undoConversationCover.controller'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'

// actorId prop is accepted for API compat but overridden by session identity —
// prevents a caller from operating on a different actor's conversations.
export default function useConversationCover({ actorId: _actorId, conversationId }) {
  const { actorId } = useIdentity() ?? {}
  const [conversationCovered, setConversationCovered] = useState(false)

  // ✅ HYDRATE: if user previously hid this conversation, show cover after refresh
  useEffect(() => {
    if (!actorId || !conversationId) return

    let alive = true

    ;(async () => {
      try {
        const covered = await getConversationCoverStatus({ actorId, conversationId })
        if (!alive) return
        setConversationCovered(!!covered)
      } catch (e) {
        if (!alive) return
        if (import.meta.env.DEV) console.warn('[useConversationCover] hydrate threw:', e)
      }
    })()

    return () => {
      alive = false
    }
  }, [actorId, conversationId])

  const undoConversationCoverAction = useCallback(async () => {
    if (!actorId || !conversationId) return

    try {
      const res = await undoConversationCover({ actorId, conversationId })
      if (!res?.ok) {
        if (import.meta.env.DEV) console.warn('[useConversationCover] undo failed')
        return
      }
      setConversationCovered(false)
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[useConversationCover] undo threw:', e)
    }
  }, [actorId, conversationId])

  return {
    conversationCovered,
    setConversationCovered,
    undoConversationCover: undoConversationCoverAction,
  }
}
