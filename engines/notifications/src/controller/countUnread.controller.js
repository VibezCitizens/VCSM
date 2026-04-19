// ============================================================
// Notifications Engine — Count Unread Controller
// ============================================================

import { createTrace, getSupabaseClient } from '../config.js'

// ── Short-lived cache + in-flight dedup ──────────────────────
// Multiple UI consumers (useNotiCount, useUnreadBadge, useNotificationsHeader)
// can call countUnread for the same actor within milliseconds. This prevents
// duplicate notification.recipients + inbox_items queries.
const _countCache = new Map()
const _COUNT_TTL = 5_000 // 5 seconds — short enough to stay fresh, long enough to dedup
const _countInflight = new Map()

function _getCachedCount(key) {
  const entry = _countCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.at > _COUNT_TTL) {
    _countCache.delete(key)
    return null
  }
  return entry.count
}

/** Bust the countUnread cache (call after markSeen, dismiss, etc.). */
export function invalidateCountUnreadCache(actorId) {
  if (actorId) {
    // Clear all keys starting with this actorId
    for (const key of _countCache.keys()) {
      if (key.startsWith(actorId)) _countCache.delete(key)
    }
    for (const key of _countInflight.keys()) {
      if (key.startsWith(actorId)) _countInflight.delete(key)
    }
  } else {
    _countCache.clear()
    _countInflight.clear()
  }
}

/**
 * Count unseen in-app notifications for an actor.
 * Queries inbox_items joined through recipients to find unseen, non-dismissed, non-archived items.
 *
 * Results are cached for 5s and in-flight requests are deduped to prevent
 * multiple UI consumers from triggering duplicate DB queries.
 *
 * @param {Object} params
 * @param {string} params.recipientActorId
 * @param {string} [params.recipientDomain]
 * @returns {Promise<number>}
 */
export async function countUnread({ recipientActorId, recipientDomain = null }) {
  const cacheKey = `${recipientActorId}:${recipientDomain ?? '_'}`

  // Return cached result if fresh
  const cached = _getCachedCount(cacheKey)
  if (cached !== null) return cached

  // Return in-flight promise if one exists
  const inflight = _countInflight.get(cacheKey)
  if (inflight) return inflight

  const pending = _countUnreadInner({ recipientActorId, recipientDomain, cacheKey })
  _countInflight.set(cacheKey, pending)
  pending.finally(() => _countInflight.delete(cacheKey))
  return pending
}

async function _countUnreadInner({ recipientActorId, recipientDomain, cacheKey }) {
  const trace = createTrace('countUnread')
  const supabase = getSupabaseClient()

  trace.report({ step: 'COUNT_UNREAD_START', status: 'start', recipientActorId })

  // Get all delivered in_app recipient IDs for this actor
  let query = supabase
    .schema('notification')
    .from('recipients')
    .select('id')
    .eq('recipient_actor_id', recipientActorId)
    .eq('delivery_channel', 'in_app')
    .eq('status', 'delivered')

  if (recipientDomain) {
    query = query.eq('recipient_domain', recipientDomain)
  }

  const { data: recipientRows, error: recipientError } = await query

  if (recipientError) {
    trace.report({ step: 'COUNT_RECIPIENTS_ERROR', status: 'error', error: recipientError })
    throw recipientError
  }

  if (!recipientRows || recipientRows.length === 0) {
    return 0
  }

  const recipientIds = recipientRows.map((r) => r.id)

  // Count unseen inbox items
  const { count, error: countError } = await supabase
    .schema('notification')
    .from('inbox_items')
    .select('recipient_id', { count: 'exact', head: true })
    .in('recipient_id', recipientIds)
    .eq('is_seen', false)
    .eq('is_dismissed', false)
    .is('archived_at', null)

  if (countError) {
    trace.report({ step: 'COUNT_INBOX_ERROR', status: 'error', error: countError })
    throw countError
  }

  const result = count ?? 0
  trace.report({ step: 'COUNT_UNREAD_SUCCESS', status: 'success', count: result })

  // Cache the result
  _countCache.set(cacheKey, { count: result, at: Date.now() })

  return result
}
