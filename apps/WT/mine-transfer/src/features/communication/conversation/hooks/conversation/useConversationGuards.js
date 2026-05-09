// src/features/chat/conversation/hooks/conversation/useConversationGuards.js
// ============================================================
// useConversationGuards
// ------------------------------------------------------------
// - View-local guard logic for ConversationView
// - Owns: guard booleans + allowSend computation
// - NO supabase
// - NO routing
// - Does not enforce business rules; it composes existing permission helpers
// ============================================================

import { useMemo } from 'react'

import canReadConversation from '../../permissions/canReadConversation'
import canSendMessage from '../../permissions/canSendMessage'

export default function useConversationGuards({
  actorId,
  conversation,
  members,
  loading,
  error,
  conversationCovered,
  canChatInteract,
}) {
  const isReady = useMemo(() => {
    return !loading && !!conversation && !!members?.length
  }, [loading, conversation, members])

  const canRead = useMemo(() => {
    if (!isReady) return false
    return canReadConversation({ actorId, members })
  }, [isReady, actorId, members])

  const allowSend = useMemo(() => {
    if (!isReady) return false
    if (!canRead) return false

    return (
      canSendMessage({ actorId, conversation, members }) &&
      !conversationCovered &&
      !!canChatInteract
    )
  }, [isReady, canRead, actorId, conversation, members, conversationCovered, canChatInteract])

  return {
    error,
    loading,
    isReady,
    canRead,
    allowSend,
  }
}
