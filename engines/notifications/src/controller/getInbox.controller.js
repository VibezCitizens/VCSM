// ============================================================
// Notifications Engine — Get Inbox Controller
// ============================================================
// Fetches inbox notifications for an actor, joining recipients + events + rendered + inbox state.

import { createTrace } from '../config.js'
import { dalListInboxRecipients, dalGetInboxItemsByRecipientIds } from '../dal/inbox.read.dal.js'
import { dalGetRenderedByRecipientIds } from '../dal/rendered.write.dal.js'
import { dalMarkInboxSeen } from '../dal/inbox.write.dal.js'
import { EventModel } from '../model/Event.model.js'
import { emit, EVENTS } from '../events.js'
import { getSupabaseClient } from '../config.js'
import { invalidateCountUnreadCache } from './countUnread.controller.js'

/**
 * Fetch inbox notifications for an actor with cursor-based pagination.
 *
 * @param {Object} params
 * @param {string} params.recipientActorId
 * @param {string} [params.recipientDomain]
 * @param {string|null} [params.cursor] — ISO timestamp cursor
 * @param {number} [params.limit]
 * @param {boolean} [params.autoMarkSeen] — auto-mark fetched items as seen
 * @returns {Promise<{ notifications: import('../types/index.js').InboxNotification[], hasMore: boolean }>}
 */
export async function getInboxNotifications({
  recipientActorId,
  recipientDomain = null,
  cursor = null,
  limit = 20,
  autoMarkSeen = true,
}) {
  const trace = createTrace('getInbox')

  trace.report({ step: 'INBOX_FETCH_START', status: 'start', recipientActorId })

  // Step 1: Fetch recipient rows (sorted by created_at DESC)
  const recipientRows = await dalListInboxRecipients({
    recipientActorId,
    recipientDomain,
    cursor,
    limit: limit + 1,
    trace,
  })

  const hasMore = recipientRows.length > limit
  const pageRows = hasMore ? recipientRows.slice(0, limit) : recipientRows
  const recipientIds = pageRows.map((r) => r.id)

  if (recipientIds.length === 0) {
    return { notifications: [], hasMore: false }
  }

  // Step 2: Fetch events, rendered content, and inbox state in parallel
  const eventIds = [...new Set(pageRows.map((r) => r.event_id))]

  const [events, renderedRows, inboxRows] = await Promise.all([
    fetchEventsByIds(eventIds, trace),
    dalGetRenderedByRecipientIds({ recipientIds, trace }),
    dalGetInboxItemsByRecipientIds({ recipientIds, trace }),
  ])

  // Build lookup maps
  const eventMap = new Map(events.map((e) => [e.id, e]))
  const renderedMap = new Map(renderedRows.map((r) => [r.recipient_id, r]))
  const inboxMap = new Map(inboxRows.map((i) => [i.recipient_id, i]))

  // Step 3: Compose inbox notifications
  const notifications = pageRows.map((r) => {
    const event = eventMap.get(r.event_id)
    const rendered = renderedMap.get(r.id)
    const inbox = inboxMap.get(r.id)

    return {
      recipientId: r.id,
      eventId: r.event_id,
      eventKey: event?.event_key ?? null,
      sourceDomain: event?.source_domain ?? r.recipient_domain,
      sourceActorId: event?.source_actor_id ?? null,
      objectType: event?.object_type ?? null,
      objectId: event?.object_id ?? null,
      payload: event?.payload ?? {},
      eventCreatedAt: event?.created_at ?? r.created_at,
      deliveryChannel: r.delivery_channel,
      inboxBucket: r.inbox_bucket,
      priority: r.priority,
      status: r.status,
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

  // Step 4: Auto-mark as seen
  if (autoMarkSeen) {
    const unseenIds = notifications.filter((n) => !n.isSeen).map((n) => n.recipientId)
    if (unseenIds.length > 0) {
      await dalMarkInboxSeen({ recipientIds: unseenIds, trace })
      invalidateCountUnreadCache(recipientActorId) // bust cached counts after markSeen
      emit(EVENTS.INBOX_MARKED_SEEN, { recipientActorId, count: unseenIds.length })
    }
  }

  trace.report({ step: 'INBOX_FETCH_COMPLETE', status: 'success', count: notifications.length, hasMore })

  return { notifications, hasMore }
}

/**
 * Fetch events by IDs from notification.events.
 */
async function fetchEventsByIds(eventIds, trace) {
  if (!eventIds || eventIds.length === 0) return []

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('notification')
    .from('events')
    .select(`
      id, event_key, source_domain, source_actor_id, source_user_id,
      object_domain, object_type, object_id,
      parent_object_type, parent_object_id,
      payload, created_at
    `)
    .in('id', eventIds)

  if (error) {
    trace?.report?.({ step: 'EVENTS_BATCH_ERROR', status: 'error', error })
    throw error
  }

  return data ?? []
}
