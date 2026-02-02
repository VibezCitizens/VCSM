// src/features/moderation/hooks/useConversationCover.js
// ============================================================
// Hook: conversation cover
// - Answers: "When should this run and how should UI respond?"
// - Owns: hydration + undo + local covered state
// ============================================================

import { useEffect, useState, useCallback } from 'react'
import { getConversationCoverStatus } from '../controllers/getConversationCoverStatus.controller'
import { undoConversationCover } from '../controllers/undoConversationCover.controller'

export default function useConversationCover({ actorId, conversationId }) {
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
        console.warn('[useConversationCover] hydrate threw:', e)
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
        console.warn('[useConversationCover] undo failed')
        return
      }
      setConversationCovered(false)
    } catch (e) {
      console.warn('[useConversationCover] undo threw:', e)
    }
  }, [actorId, conversationId])

  return {
    conversationCovered,
    setConversationCovered,
    undoConversationCover: undoConversationCoverAction,
  }
}
