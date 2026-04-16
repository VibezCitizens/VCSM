import { supabase } from '@/services/supabase/supabaseClient'

export function subscribeInboxBadge({ actorId, onChange }) {
  if (!actorId || typeof onChange !== 'function') return () => {}

  const channel = supabase.channel(`chat-badge-${actorId}`)

  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'chat', table: 'inbox_entries', filter: `actor_id=eq.${actorId}` },
    onChange
  )
  channel.on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'chat', table: 'inbox_entries', filter: `actor_id=eq.${actorId}` },
    onChange
  )
  channel.on(
    'postgres_changes',
    { event: 'DELETE', schema: 'chat', table: 'inbox_entries', filter: `actor_id=eq.${actorId}` },
    onChange
  )

  channel.subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeNotificationBadge({ actorId, onChange }) {
  if (!actorId || typeof onChange !== 'function') return () => {}

  const channel = supabase.channel(`noti-badge-${actorId}`)

  // Listen to notification.inbox_items for real-time badge updates.
  // recipient_id changes trigger seen/read/dismiss state transitions.
  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'notification', table: 'inbox_items' },
    onChange
  )
  channel.on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'notification', table: 'inbox_items' },
    onChange
  )

  // Also listen to notification.recipients for new notification deliveries.
  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'notification', table: 'recipients', filter: `recipient_actor_id=eq.${actorId}` },
    onChange
  )

  channel.subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
