const COUNT_CACHE_TTL_MS = 5000

let config = {}

const countCache = new Map()
const countInflight = new Map()

export function configureNotificationsEngine(nextConfig = {}) {
  config = { ...config, ...nextConfig }
}

function getSupabaseClient() {
  if (!config?.supabaseClient) {
    throw new Error('[NotificationsRuntime] supabaseClient not configured')
  }

  return config.supabaseClient
}

function cacheKey(recipientActorId, recipientDomain) {
  return `${recipientActorId}:${recipientDomain ?? '_'}`
}

function getCachedCount(key) {
  const cached = countCache.get(key)
  if (!cached) return null

  if (Date.now() - cached.at > COUNT_CACHE_TTL_MS) {
    countCache.delete(key)
    return null
  }

  return cached.value
}

export function invalidateCountUnreadCache(actorId = null) {
  if (!actorId) {
    countCache.clear()
    countInflight.clear()
    return
  }

  for (const key of countCache.keys()) {
    if (key.startsWith(`${actorId}:`)) countCache.delete(key)
  }

  for (const key of countInflight.keys()) {
    if (key.startsWith(`${actorId}:`)) countInflight.delete(key)
  }
}

function buildRenderFallback({ event, renderContext }) {
  const payload =
    typeof event?.payload === 'object' && event.payload !== null
      ? event.payload
      : {}

  return {
    title: typeof payload.title === 'string' ? payload.title : null,
    body: typeof payload.body === 'string' ? payload.body : null,
    ctaLabel: typeof renderContext?.ctaLabel === 'string' ? renderContext.ctaLabel : null,
    linkPath: typeof renderContext?.linkPath === 'string' ? renderContext.linkPath : null,
    imageUrl: typeof renderContext?.imageUrl === 'string' ? renderContext.imageUrl : null,
    icon: typeof renderContext?.icon === 'string' ? renderContext.icon : null,
  }
}

async function insertEvent(event) {
  const supabase = getSupabaseClient()

  const rpcArgs = {
    p_event_key: event.eventKey,
    p_source_domain: event.sourceDomain ?? 'vc',
    p_source_actor_id: event.sourceActorId ?? null,
    p_source_user_id: event.sourceUserId ?? null,
    p_object_domain: event.objectDomain ?? null,
    p_object_type: event.objectType ?? null,
    p_object_id: event.objectId ?? null,
    p_parent_object_type: event.parentObjectType ?? null,
    p_parent_object_id: event.parentObjectId ?? null,
    p_app_id: event.appId ?? null,
    p_realm_id: event.realmId ?? null,
    p_visibility: event.visibility ?? 'private',
    p_payload: event.payload ?? {},
  }

  const { data, error } = await supabase
    .schema('notification')
    .rpc('create_event', rpcArgs)
    .single()

  if (error) throw error

  return data
}

async function insertRecipients(eventId, recipients) {
  const supabase = getSupabaseClient()

  const rows = recipients.map((recipient) => ({
    recipient_domain: recipient.recipientDomain ?? 'vc',
    recipient_kind: recipient.recipientKind ?? 'actor',
    recipient_actor_id: recipient.recipientActorId ?? null,
    recipient_user_id: recipient.recipientUserId ?? null,
    recipient_user_app_account_id: recipient.recipientUserAppAccountId ?? null,
    delivery_channel: recipient.deliveryChannel ?? 'in_app',
    inbox_bucket: recipient.inboxBucket ?? 'default',
    priority: recipient.priority ?? 3,
  }))

  const { data, error } = await supabase
    .schema('notification')
    .rpc('insert_recipients', {
      p_event_id: eventId,
      p_recipients: rows,
    })

  if (error) throw error

  return Array.isArray(data) ? data : []
}

async function upsertRendered(recipientId, { title, body, ctaLabel, linkPath, imageUrl, icon }) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
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

async function insertInboxItem(recipientId) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('notification')
    .rpc('insert_inbox_item', {
      p_recipient_id: recipientId,
    })

  if (error) throw error
}

async function updateRecipientStatus(recipientId, status, errorMessage = null) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('notification')
    .rpc('update_recipient_status', {
      p_recipient_id: recipientId,
      p_status: status,
      p_error_message: errorMessage,
    })

  if (error) throw error
}

async function fetchEventsByIds(eventIds) {
  if (!Array.isArray(eventIds) || eventIds.length === 0) return []

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
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

  return data ?? []
}

async function fetchRenderedByRecipientIds(recipientIds) {
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return []

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
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

  return data ?? []
}

async function fetchInboxRowsByRecipientIds(recipientIds) {
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return []

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
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

  return data ?? []
}

async function fetchRecipientRows({ recipientActorId, recipientDomain = null, cursor = null, limit = 20 }) {
  const supabase = getSupabaseClient()

  let query = supabase
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

  return data ?? []
}

async function markRecipientIdsSeen(recipientIds) {
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return 0

  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .schema('notification')
    .from('inbox_items')
    .update({ is_seen: true, seen_at: now, updated_at: now })
    .in('recipient_id', recipientIds)
    .eq('is_seen', false)
    .select('recipient_id')

  if (error) throw error

  return data?.length ?? 0
}

export async function publishEvent({ event, recipients = [], renderContext = {} } = {}) {
  if (!event?.eventKey) {
    throw new Error('[NotificationsRuntime] event.eventKey is required')
  }

  const errors = []

  const eventRow = await insertEvent(event)
  const eventId = eventRow?.id ?? null

  if (!eventId || !Array.isArray(recipients) || recipients.length === 0) {
    return {
      eventId,
      recipientCount: 0,
      deliveredCount: 0,
      errors,
    }
  }

  const recipientRows = await insertRecipients(eventId, recipients)
  const renderedFallback = buildRenderFallback({ event, renderContext })

  let deliveredCount = 0

  for (const recipient of recipientRows) {
    const recipientId = recipient?.id ?? null
    if (!recipientId) continue

    try {
      await upsertRendered(recipientId, renderedFallback)
      await insertInboxItem(recipientId)
      await updateRecipientStatus(recipientId, 'delivered', null)
      deliveredCount += 1
    } catch (error) {
      errors.push(error?.message ?? 'Failed to deliver notification')
      try {
        await updateRecipientStatus(recipientId, 'failed', error?.message ?? null)
      } catch {
        // no-op
      }
    }
  }

  invalidateCountUnreadCache()

  return {
    eventId,
    recipientCount: recipientRows.length,
    deliveredCount,
    errors,
  }
}

export async function getInboxNotifications({
  recipientActorId,
  recipientDomain = null,
  cursor = null,
  limit = 20,
  autoMarkSeen = true,
} = {}) {
  if (!recipientActorId) {
    return { notifications: [], hasMore: false }
  }

  const recipientRows = await fetchRecipientRows({
    recipientActorId,
    recipientDomain,
    cursor,
    limit: limit + 1,
  })

  const hasMore = recipientRows.length > limit
  const pageRows = hasMore ? recipientRows.slice(0, limit) : recipientRows

  if (!pageRows.length) {
    return { notifications: [], hasMore: false }
  }

  const recipientIds = pageRows.map((row) => row.id)
  const eventIds = [...new Set(pageRows.map((row) => row.event_id).filter(Boolean))]

  const [events, renderedRows, inboxRows] = await Promise.all([
    fetchEventsByIds(eventIds),
    fetchRenderedByRecipientIds(recipientIds),
    fetchInboxRowsByRecipientIds(recipientIds),
  ])

  const eventById = new Map(events.map((row) => [row.id, row]))
  const renderedByRecipientId = new Map(renderedRows.map((row) => [row.recipient_id, row]))
  const inboxByRecipientId = new Map(inboxRows.map((row) => [row.recipient_id, row]))

  const notifications = pageRows.map((recipient) => {
    const event = eventById.get(recipient.event_id)
    const rendered = renderedByRecipientId.get(recipient.id)
    const inbox = inboxByRecipientId.get(recipient.id)

    return {
      recipientId: recipient.id,
      eventId: recipient.event_id,
      eventKey: event?.event_key ?? null,
      sourceDomain: event?.source_domain ?? recipient.recipient_domain ?? null,
      sourceActorId: event?.source_actor_id ?? null,
      objectType: event?.object_type ?? null,
      objectId: event?.object_id ?? null,
      payload: event?.payload ?? {},
      eventCreatedAt: event?.created_at ?? recipient.created_at ?? null,
      deliveryChannel: recipient.delivery_channel ?? null,
      inboxBucket: recipient.inbox_bucket ?? null,
      priority: recipient.priority ?? null,
      status: recipient.status ?? null,
      title: rendered?.title ?? null,
      body: rendered?.body ?? null,
      ctaLabel: rendered?.cta_label ?? null,
      linkPath: rendered?.link_path ?? null,
      imageUrl: rendered?.image_url ?? null,
      icon: rendered?.icon ?? null,
      isSeen: inbox?.is_seen ?? false,
      isRead: inbox?.is_read ?? false,
      isOpened: inbox?.is_opened ?? false,
      isDismissed: inbox?.is_dismissed ?? false,
      badgeCounted: inbox?.badge_counted ?? true,
      archivedAt: inbox?.archived_at ?? null,
      snoozedUntil: inbox?.snoozed_until ?? null,
    }
  })

  if (autoMarkSeen) {
    const unseenRecipientIds = notifications
      .filter((row) => !row.isSeen)
      .map((row) => row.recipientId)

    if (unseenRecipientIds.length) {
      await markRecipientIdsSeen(unseenRecipientIds)
      invalidateCountUnreadCache(recipientActorId)
    }
  }

  return { notifications, hasMore }
}

async function countUnreadInner({ recipientActorId, recipientDomain }) {
  const supabase = getSupabaseClient()

  let recipientQuery = supabase
    .schema('notification')
    .from('recipients')
    .select('id')
    .eq('recipient_actor_id', recipientActorId)
    .eq('delivery_channel', 'in_app')
    .eq('status', 'delivered')

  if (recipientDomain) {
    recipientQuery = recipientQuery.eq('recipient_domain', recipientDomain)
  }

  const { data: recipients, error: recipientsError } = await recipientQuery

  if (recipientsError) throw recipientsError

  if (!recipients?.length) return 0

  const recipientIds = recipients.map((row) => row.id)

  const { count, error: countError } = await supabase
    .schema('notification')
    .from('inbox_items')
    .select('recipient_id', { count: 'exact', head: true })
    .in('recipient_id', recipientIds)
    .eq('is_seen', false)
    .eq('is_dismissed', false)
    .is('archived_at', null)

  if (countError) throw countError

  return count ?? 0
}

export async function countUnread({ recipientActorId, recipientDomain = null } = {}) {
  if (!recipientActorId) return 0

  const key = cacheKey(recipientActorId, recipientDomain)
  const cached = getCachedCount(key)
  if (cached !== null) return cached

  if (countInflight.has(key)) {
    return countInflight.get(key)
  }

  const pending = countUnreadInner({ recipientActorId, recipientDomain })
    .then((value) => {
      countCache.set(key, { value, at: Date.now() })
      return value
    })
    .finally(() => {
      countInflight.delete(key)
    })

  countInflight.set(key, pending)

  return pending
}

export async function markSeen({ recipientIds } = {}) {
  const count = await markRecipientIdsSeen(recipientIds)
  invalidateCountUnreadCache()
  return count
}

export async function markRead({ recipientId } = {}) {
  if (!recipientId) return null

  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
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

  invalidateCountUnreadCache()
  return data ?? null
}

export async function dismiss({ recipientId } = {}) {
  if (!recipientId) return null

  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
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

  invalidateCountUnreadCache()
  return data ?? null
}

export async function archive({ recipientId } = {}) {
  if (!recipientId) return null

  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
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

  invalidateCountUnreadCache()
  return data ?? null
}
