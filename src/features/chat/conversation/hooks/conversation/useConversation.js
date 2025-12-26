// src/features/chat/conversation/hooks/conversation/useConversation.js
// ============================================================
// useConversation
// ------------------------------------------------------------
// PURPOSE
// ------------------------------------------------------------
// Conversation CONTEXT hook.
//
// This hook owns *conversation-level state only*.
// It does NOT own messages or members.
//
// Responsibilities:
// - Ensure the actor can access the conversation (RPC-safe)
// - Load conversation metadata
// - Mark conversation as read (idempotent)
// - Subscribe to conversation-level realtime updates
//
// Non-responsibilities (by design):
// - Member loading
// - Message fetching
// - Message pagination
// - Optimistic message lifecycle
// - Delete / unsend logic
//
// Member state is owned by:
//   → useConversationMembers
//
// Message state is owned by:
//   → useConversationMessages
//
// ARCHITECTURE RULE:
// Hook → Controller → DAL → DB
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'

// RPC / controllers
import { openConversation } from '@/features/chat/start/dal/rpc/openConversation.rpc'
import { markConversationRead } 
  from '@/features/chat/conversation/controllers/markConversationRead.controller'

// realtime
import { subscribeToConversation } 
  from '@/features/chat/conversation/realtime/subscribeToConversation'

export default function useConversation({
  conversationId,
  actorId,
}) {
  /* ============================================================
     State
     ============================================================ */

  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const unsubRef = useRef(null)

  /* ============================================================
     Initial load
     ============================================================ */
  const loadInitial = useCallback(async () => {
    if (!conversationId || !actorId) return

    setLoading(true)
    setError(null)

    try {
      // 1️⃣ Ensure membership / inbox via RPC (RLS-safe)
      const convo = await openConversation({
        conversationId,
        actorId,
      })

      if (!convo) {
        throw new Error('Conversation not found or access denied')
      }

      setConversation(convo)

      // 2️⃣ Mark conversation as read (idempotent)
      await markConversationRead({
        conversationId,
        actorId,
      })
    } catch (err) {
      console.error('[useConversation] loadInitial failed', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [conversationId, actorId])

  /* ============================================================
     Realtime: conversation-level updates ONLY
     ============================================================ */
  useEffect(() => {
    if (!conversationId || !actorId) return

    unsubRef.current?.()

    unsubRef.current = subscribeToConversation({
      conversationId,
      actorId,

      // Conversation metadata updates (title, mute, etc.)
      onConversationUpdated: (updates) => {
        setConversation((prev) =>
          prev ? { ...prev, ...updates } : prev
        )
      },
    })

    return () => {
      unsubRef.current?.()
      unsubRef.current = null
    }
  }, [conversationId, actorId])

  /* ============================================================
     Mount / conversation switch
     ============================================================ */
  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  /* ============================================================
     Public API
     ============================================================ */
  return {
    conversation,
    loading,
    error,
    refresh: loadInitial,
  }
}
