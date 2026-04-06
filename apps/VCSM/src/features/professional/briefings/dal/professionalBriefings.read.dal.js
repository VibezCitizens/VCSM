import { supabase } from '@/services/supabase/supabaseClient'

export async function dalListProfessionalBriefings({
  recipientActorId,
  beforeCreatedAt = null,
  limit = 40,
}) {
  if (!recipientActorId) return []

  let query = supabase
    .schema('vc')
    .from('notifications')
    .select(
      `
      id,
      recipient_actor_id,
      actor_id,
      kind,
      object_type,
      object_id,
      link_path,
      context,
      is_read,
      is_seen,
      created_at
    `
    )
    .eq('recipient_actor_id', recipientActorId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (beforeCreatedAt) {
    query = query.lt('created_at', beforeCreatedAt)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function dalMarkProfessionalBriefingsSeen({
  recipientActorId,
  notificationIds = [],
}) {
  if (!recipientActorId || !Array.isArray(notificationIds) || notificationIds.length === 0) {
    return
  }

  const { error } = await supabase
    .schema('vc')
    .from('notifications')
    .update({ is_seen: true })
    .eq('recipient_actor_id', recipientActorId)
    .in('id', notificationIds)

  if (error) throw error
}
