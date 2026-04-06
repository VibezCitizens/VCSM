// src/dal/subscribeToConversation.js
// ============================================================
// subscribeToConversation
// ------------------------------------------------------------
// Actor-based realtime subscription for conversation updates.
//
// LIFECYCLE (strict order):
//   1. Create fresh channel (unique name per subscription)
//   2. Attach all .on('postgres_changes') handlers
//   3. Call .subscribe() exactly once
//   4. Return cleanup function that removes the channel
//
// Channels are never reused between subscriptions.
// ============================================================

import { getSupabaseClient } from '../config.js'

let _subCounter = 0

/**
 * Subscribe to realtime updates for a conversation.
 *
 * @param {Object} params
 * @param {string} params.conversationId
 * @param {string} params.actorId
 * @param {(message: Object) => void} [params.onMessageInserted]
 * @param {(message: Object) => void} [params.onMessageUpdated]
 * @param {(conversation: Object) => void} [params.onConversationUpdated]
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

  const supabase = getSupabaseClient()

  // Unique channel name per subscription to prevent reuse of
  // already-subscribed channels (React Strict Mode, fast remount).
  _subCounter++
  const channelName = `chat-conv-${conversationId}-${_subCounter}`

  // 1. Create fresh channel + attach all handlers BEFORE subscribe
  let channel = supabase.channel(channelName)

  if (onMessageInserted) {
    channel = channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'chat',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessageInserted(payload.new)
      }
    )
  }

  if (onMessageUpdated) {
    channel = channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'chat',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessageUpdated(payload.new)
      }
    )
  }

  if (onConversationUpdated) {
    channel = channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'chat',
        table: 'conversations',
        filter: `id=eq.${conversationId}`,
      },
      (payload) => {
        onConversationUpdated(payload.new)
      }
    )
  }

  // 2. Subscribe exactly once after all handlers are attached
  channel.subscribe()

  // 3. Return cleanup
  return () => {
    supabase.removeChannel(channel)
  }
}
