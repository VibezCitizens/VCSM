// src/features/chat/realtime/subscribeToConversation.js
// ============================================================
// subscribeToConversation
// ------------------------------------------------------------
// - Actor-based realtime subscription helper
// - Listens to messages + conversation updates
// - Returns explicit unsubscribe function
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Subscribe to realtime updates for a conversation.
 *
 * @param {Object} params
 * @param {string} params.conversationId
 * @param {string} params.actorId
 *
 * @param {(message: Object) => void} [params.onMessageInserted]
 * @param {(message: Object) => void} [params.onMessageUpdated]
 * @param {(conversation: Object) => void} [params.onConversationUpdated]
 *
 * @returns {() => void} unsubscribe function
 */
export function subscribeToConversation({
  conversationId,
  actorId,
  onMessageInserted,
  onMessageUpdated,
  onConversationUpdated,
}) {
  if (!conversationId || !actorId) {
    throw new Error('[subscribeToConversation] missing params')
  }

  const channel = supabase.channel(
    `vc-conversation-${conversationId}`
  )

  /* ============================================================
     Message inserts
     ============================================================ */
  if (onMessageInserted) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'vc',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessageInserted(payload.new)
      }
    )
  }

  /* ============================================================
     Message updates (edit / delete)
     ============================================================ */
  if (onMessageUpdated) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'vc',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessageUpdated(payload.new)
      }
    )
  }

  /* ============================================================
     Conversation updates (last message, title, avatar, etc.)
     ============================================================ */
  if (onConversationUpdated) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'vc',
        table: 'conversations',
        filter: `id=eq.${conversationId}`,
      },
      (payload) => {
        onConversationUpdated(payload.new)
      }
    )
  }

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      // ready
    }
  })

  /* ============================================================
     Unsubscribe helper
     ============================================================ */
  return () => {
    supabase.removeChannel(channel)
  }
}
