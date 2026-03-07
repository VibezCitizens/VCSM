import { supabase } from '@/services/supabase/supabaseClient'

export function subscribeInboxBadge({ actorId, onChange }) {
  if (!actorId || typeof onChange !== 'function') return () => {}

  const channel = supabase.channel(`chat-badge-${actorId}`)

  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'vc', table: 'inbox_entries', filter: `actor_id=eq.${actorId}` },
    onChange
  )
  channel.on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'vc', table: 'inbox_entries', filter: `actor_id=eq.${actorId}` },
    onChange
  )
  channel.on(
    'postgres_changes',
    { event: 'DELETE', schema: 'vc', table: 'inbox_entries', filter: `actor_id=eq.${actorId}` },
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

  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'vc', table: 'notifications', filter: `recipient_actor_id=eq.${actorId}` },
    onChange
  )
  channel.on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'vc', table: 'notifications', filter: `recipient_actor_id=eq.${actorId}` },
    onChange
  )
  channel.on(
    'postgres_changes',
    { event: 'DELETE', schema: 'vc', table: 'notifications', filter: `recipient_actor_id=eq.${actorId}` },
    onChange
  )

  channel.subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
