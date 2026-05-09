// src/features/chat/inbox/realtime/subscribeToInbox.js
// ============================================================
// subscribeToInbox
// ------------------------------------------------------------
// - Actor-based realtime inbox listener
// - Listens to vc.inbox_entries mutations
// - Actor-scoped channel
// - Safe for actor switching
// - Returns explicit unsubscribe function
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Subscribe to realtime inbox updates for an actor.
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {() => void} params.onInboxChanged
 *
 * @returns {() => void} unsubscribe function
 */
export function subscribeToInbox({
  actorId,
  onInboxChanged,
}) {
  if (!actorId) {
    throw new Error('[subscribeToInbox] actorId required')
  }

  const channel = supabase.channel(
    `vc-inbox-${actorId}`
  )

  const handleChange = () => {
    if (typeof onInboxChanged === 'function') {
      onInboxChanged()
    }
  }

  /* ============================================================
     INSERT events
     ============================================================ */
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'vc',
      table: 'inbox_entries',
      filter: `actor_id=eq.${actorId}`,
    },
    handleChange
  )

  /* ============================================================
     UPDATE events
     ============================================================ */
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'vc',
      table: 'inbox_entries',
      filter: `actor_id=eq.${actorId}`,
    },
    handleChange
  )

  /* ============================================================
     DELETE events
     ============================================================ */
  channel.on(
    'postgres_changes',
    {
      event: 'DELETE',
      schema: 'vc',
      table: 'inbox_entries',
      filter: `actor_id=eq.${actorId}`,
    },
    handleChange
  )

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      // Realtime inbox ready
    }
  })

  /* ============================================================
     Unsubscribe helper
     ============================================================ */
  return () => {
    supabase.removeChannel(channel)
  }
}
