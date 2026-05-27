import {
  archiveNotificationDAL,
  configureNotificationsRuntimeDAL,
  countNotificationUnreadInboxItemsDAL,
  dismissNotificationDAL,
  insertNotificationEventDAL,
  insertNotificationInboxItemDAL,
  insertNotificationRecipientsDAL,
  markNotificationReadDAL,
  markNotificationRecipientsSeenDAL,
  readNotificationEventsByIdsDAL,
  readNotificationInboxRowsByRecipientIdsDAL,
  readNotificationRecipientIdsForUnreadDAL,
  readNotificationRecipientRowsDAL,
  readNotificationRenderedByRecipientIdsDAL,
  updateNotificationRecipientStatusDAL,
  upsertNotificationRenderedDAL,
} from '@/features/notifications/runtime/notificationRuntime.dal'
import { mapNotificationInboxRows } from '@/features/notifications/runtime/notificationRuntime.model'
const COUNT_CACHE_TTL_MS = 5000

const countCache = new Map(), countInflight = new Map()

export function configureNotificationsEngine(nextConfig = {}) {
  configureNotificationsRuntimeDAL(nextConfig)
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

function buildEventRpcArgs(event) {
  return {
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
}

function buildRecipientRows(recipients) {
  return recipients.map((recipient) => ({
    recipient_domain: recipient.recipientDomain ?? 'vc',
    recipient_kind: recipient.recipientKind ?? 'actor',
    recipient_actor_id: recipient.recipientActorId ?? null,
    recipient_user_id: recipient.recipientUserId ?? null,
    recipient_user_app_account_id: recipient.recipientUserAppAccountId ?? null,
    delivery_channel: recipient.deliveryChannel ?? 'in_app',
    inbox_bucket: recipient.inboxBucket ?? 'default',
    priority: recipient.priority ?? 3,
  }))
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

async function markRecipientIdsSeen(recipientIds) {
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return 0

  const now = new Date().toISOString()
  return markNotificationRecipientsSeenDAL(recipientIds, now)
}

export async function publishEvent({ event, recipients = [], renderContext = {} } = {}) {
  if (!event?.eventKey) {
    throw new Error('[NotificationsRuntime] event.eventKey is required')
  }

  const errors = []

  const eventRow = await insertNotificationEventDAL(buildEventRpcArgs(event))
  const eventId = eventRow?.id ?? null

  if (!eventId || !Array.isArray(recipients) || recipients.length === 0) {
    return {
      eventId,
      recipientCount: 0,
      deliveredCount: 0,
      errors,
    }
  }

  const recipientRows = await insertNotificationRecipientsDAL(eventId, buildRecipientRows(recipients))
  const renderedFallback = buildRenderFallback({ event, renderContext })

  const deliveryResults = await Promise.allSettled(
    recipientRows.map(async (recipient) => {
      const recipientId = recipient?.id ?? null
      if (!recipientId) return null
      try {
        await upsertNotificationRenderedDAL(recipientId, renderedFallback)
        await insertNotificationInboxItemDAL(recipientId)
        await updateNotificationRecipientStatusDAL(recipientId, 'delivered', null)
      } catch (error) {
        try { await updateNotificationRecipientStatusDAL(recipientId, 'failed', error?.message ?? null) } catch { /* */ }
        throw error
      }
      return recipientId
    })
  )
  let deliveredCount = 0
  for (const { status, value, reason } of deliveryResults) {
    if (status === 'fulfilled' && value != null) deliveredCount += 1
    else if (status === 'rejected') errors.push(reason?.message ?? 'Failed to deliver notification')
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

  const recipientRows = await readNotificationRecipientRowsDAL({
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
    readNotificationEventsByIdsDAL(eventIds),
    readNotificationRenderedByRecipientIdsDAL(recipientIds),
    readNotificationInboxRowsByRecipientIdsDAL(recipientIds),
  ])

  const notifications = mapNotificationInboxRows({
    recipientRows: pageRows,
    events,
    renderedRows,
    inboxRows,
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
  const recipients = await readNotificationRecipientIdsForUnreadDAL({
    recipientActorId,
    recipientDomain,
  })

  if (!recipients.length) return 0

  const recipientIds = recipients.map((row) => row.id)
  return countNotificationUnreadInboxItemsDAL(recipientIds)
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

  const data = await markNotificationReadDAL({
    recipientId,
    now: new Date().toISOString(),
  })

  invalidateCountUnreadCache()
  return data ?? null
}

export async function dismiss({ recipientId } = {}) {
  if (!recipientId) return null

  const data = await dismissNotificationDAL({
    recipientId,
    now: new Date().toISOString(),
  })

  invalidateCountUnreadCache()
  return data ?? null
}

export async function archive({ recipientId } = {}) {
  if (!recipientId) return null

  const data = await archiveNotificationDAL({
    recipientId,
    now: new Date().toISOString(),
  })

  invalidateCountUnreadCache()
  return data ?? null
}
