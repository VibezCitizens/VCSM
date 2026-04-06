// src/dal/subscribeToInbox.js
// ============================================================
// subscribeToInbox
// ------------------------------------------------------------
// Actor-based realtime inbox listener.
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

let _inboxSubCounter = 0

/**
 * Subscribe to realtime inbox updates for an actor.
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {() => void} params.onInboxChanged
 * @returns {() => void} unsubscribe function
 */
export function subscribeToInbox({
  actorId,
  onInboxChanged,
}) {
  if (!actorId) {
    throw new Error('[subscribeToInbox] actorId required')
  }

  const supabase = getSupabaseClient()

  _inboxSubCounter++
  const channelName = `chat-inbox-${actorId}-${_inboxSubCounter}`

  const handleChange = () => {
    if (typeof onInboxChanged === 'function') {
      onInboxChanged()
    }
  }

  // Create fresh channel + attach all handlers BEFORE subscribe
  const channel = supabase.channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'chat',
        table: 'inbox_entries',
        filter: `actor_id=eq.${actorId}`,
      },
      handleChange
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'chat',
        table: 'inbox_entries',
        filter: `actor_id=eq.${actorId}`,
      },
      handleChange
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'chat',
        table: 'inbox_entries',
        filter: `actor_id=eq.${actorId}`,
      },
      handleChange
    )

  channel.subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
