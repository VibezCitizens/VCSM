let config = {}

export function configureNotificationsRuntimeDAL(nextConfig = {}) {
  config = { ...config, ...nextConfig }
}

function getSupabaseClient() {
  if (!config?.supabaseClient) {
    throw new Error('[NotificationsRuntimeDAL] supabaseClient not configured')
  }

  return config.supabaseClient
}

export async function insertNotificationEventDAL(rpcArgs) {
  const { data, error } = await getSupabaseClient()
    .schema('notification')
    .rpc('create_event', rpcArgs)
    .single()

  if (error) throw error
  return data
}

export async function insertNotificationRecipientsDAL(eventId, recipientRows) {
  if (!eventId || !Array.isArray(recipientRows) || recipientRows.length === 0) return []

  const { data, error } = await getSupabaseClient()
    .schema('notification')
    .rpc('insert_recipients', {
      p_event_id: eventId,
      p_recipients: recipientRows,
    })

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function upsertNotificationRenderedDAL(
  recipientId,
  { title, body, ctaLabel, linkPath, imageUrl, icon }
) {
  const { error } = await getSupabaseClient()
    .schema('notification')
    .rpc('upsert_rendered', {
      p_recipient_id: recipientId,
      p_template_id: null,
      p_locale: 'en',
      p_title: title,
      p_body: body,
      p_cta_label: ctaLabel,
      p_link_path: linkPath,
      p_image_url: imageUrl,
      p_icon: icon,
      p_render_context: {},
    })

  if (error) throw error
}

export async function insertNotificationInboxItemDAL(recipientId) {
  const { error } = await getSupabaseClient()
    .schema('notification')
    .rpc('insert_inbox_item', {
      p_recipient_id: recipientId,
    })

  if (error) throw error
}

export async function updateNotificationRecipientStatusDAL(recipientId, status, errorMessage = null) {
  const { error } = await getSupabaseClient()
    .schema('notification')
    .rpc('update_recipient_status', {
      p_recipient_id: recipientId,
      p_status: status,
      p_error_message: errorMessage,
    })

  if (error) throw error
}

export async function readNotificationEventsByIdsDAL(eventIds) {
  if (!Array.isArray(eventIds) || eventIds.length === 0) return []

  const { data, error } = await getSupabaseClient()
    .schema('notification')
    .from('events')
    .select(`
      id,
      event_key,
      source_domain,
      source_actor_id,
      object_type,
      object_id,
      payload,
      created_at
    `)
    .in('id', eventIds)

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function readNotificationRenderedByRecipientIdsDAL(recipientIds) {
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return []

  const { data, error } = await getSupabaseClient()
    .schema('notification')
    .from('rendered')
    .select(`
      recipient_id,
      title,
      body,
      cta_label,
      link_path,
      image_url,
      icon
    `)
    .in('recipient_id', recipientIds)

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function readNotificationInboxRowsByRecipientIdsDAL(recipientIds) {
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return []

  const { data, error } = await getSupabaseClient()
    .schema('notification')
    .from('inbox_items')
    .select(`
      recipient_id,
      is_seen,
      is_read,
      is_opened,
      is_dismissed,
      badge_counted,
      archived_at,
      snoozed_until
    `)
    .in('recipient_id', recipientIds)

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function readNotificationRecipientRowsDAL({
  recipientActorId,
  recipientDomain = null,
  cursor = null,
  limit = 20,
} = {}) {
  if (!recipientActorId) return []

  let query = getSupabaseClient()
    .schema('notification')
    .from('recipients')
    .select(`
      id,
      event_id,
      recipient_domain,
      delivery_channel,
      inbox_bucket,
      priority,
      status,
      created_at
    `)
    .eq('recipient_actor_id', recipientActorId)
    .eq('delivery_channel', 'in_app')
    .eq('status', 'delivered')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (recipientDomain) {
    query = query.eq('recipient_domain', recipientDomain)
  }

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function markNotificationRecipientsSeenDAL(recipientIds, now) {
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return 0

  const { data, error } = await getSupabaseClient()
    .schema('notification')
    .from('inbox_items')
    .update({ is_seen: true, seen_at: now, updated_at: now })
    .in('recipient_id', recipientIds)
    .eq('is_seen', false)
    .select('recipient_id')

  if (error) throw error
  return data?.length ?? 0
}

export async function readNotificationRecipientIdsForUnreadDAL({
  recipientActorId,
  recipientDomain = null,
} = {}) {
  if (!recipientActorId) return []

  let query = getSupabaseClient()
    .schema('notification')
    .from('recipients')
    .select('id')
    .eq('recipient_actor_id', recipientActorId)
    .eq('delivery_channel', 'in_app')
    .eq('status', 'delivered')

  if (recipientDomain) {
    query = query.eq('recipient_domain', recipientDomain)
  }

  const { data, error } = await query

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function countNotificationUnreadInboxItemsDAL(recipientIds) {
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return 0

  const { count, error } = await getSupabaseClient()
    .schema('notification')
    .from('inbox_items')
    .select('recipient_id', { count: 'exact', head: true })
    .in('recipient_id', recipientIds)
    .eq('is_seen', false)
    .eq('is_dismissed', false)
    .is('archived_at', null)

  if (error) throw error
  return count ?? 0
}

export async function markNotificationReadDAL({ recipientId, now } = {}) {
  if (!recipientId) return null

  const { data, error } = await getSupabaseClient()
    .schema('notification')
    .from('inbox_items')
    .update({
      is_read: true,
      read_at: now,
      is_seen: true,
      seen_at: now,
      updated_at: now,
    })
    .eq('recipient_id', recipientId)
    .select('recipient_id, is_read, read_at')
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function dismissNotificationDAL({ recipientId, now } = {}) {
  if (!recipientId) return null

  const { data, error } = await getSupabaseClient()
    .schema('notification')
    .from('inbox_items')
    .update({
      is_dismissed: true,
      dismissed_at: now,
      updated_at: now,
    })
    .eq('recipient_id', recipientId)
    .select('recipient_id, is_dismissed, dismissed_at')
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function archiveNotificationDAL({ recipientId, now } = {}) {
  if (!recipientId) return null

  const { data, error } = await getSupabaseClient()
    .schema('notification')
    .from('inbox_items')
    .update({
      archived_at: now,
      updated_at: now,
    })
    .eq('recipient_id', recipientId)
    .select('recipient_id, archived_at')
    .maybeSingle()

  if (error) throw error
  return data ?? null
}
