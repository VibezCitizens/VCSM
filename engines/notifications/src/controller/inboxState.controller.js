// ============================================================
// Notifications Engine — Inbox State Controller
// ============================================================
// Manages inbox state transitions: mark seen, mark read, dismiss, archive.

import { createTrace } from '../config.js'
import { dalMarkInboxSeen, dalMarkInboxRead, dalDismissInboxItem, dalArchiveInboxItem } from '../dal/inbox.write.dal.js'
import { emit, EVENTS } from '../events.js'
import { invalidateCountUnreadCache } from './countUnread.controller.js'

/**
 * Mark specific inbox items as seen.
 *
 * @param {Object} params
 * @param {string[]} params.recipientIds
 * @returns {Promise<number>} count of updated rows
 */
export async function markSeen({ recipientIds }) {
  const trace = createTrace('markSeen')
  const count = await dalMarkInboxSeen({ recipientIds, trace })
  if (count > 0) {
    invalidateCountUnreadCache() // bust cached counts after state change
    emit(EVENTS.INBOX_MARKED_SEEN, { recipientIds, count })
  }
  return count
}

/**
 * Mark a single inbox item as read.
 *
 * @param {Object} params
 * @param {string} params.recipientId
 * @returns {Promise<Object|null>}
 */
export async function markRead({ recipientId }) {
  const trace = createTrace('markRead')
  const result = await dalMarkInboxRead({ recipientId, trace })
  if (result) {
    invalidateCountUnreadCache() // bust cached counts after state change
    emit(EVENTS.INBOX_MARKED_READ, { recipientId })
  }
  return result
}

/**
 * Dismiss an inbox item.
 *
 * @param {Object} params
 * @param {string} params.recipientId
 * @returns {Promise<Object|null>}
 */
export async function dismiss({ recipientId }) {
  const trace = createTrace('dismiss')
  const result = await dalDismissInboxItem({ recipientId, trace })
  if (result) {
    invalidateCountUnreadCache() // bust cached counts after state change
    emit(EVENTS.INBOX_DISMISSED, { recipientId })
  }
  return result
}

/**
 * Archive an inbox item.
 *
 * @param {Object} params
 * @param {string} params.recipientId
 * @returns {Promise<Object|null>}
 */
export async function archive({ recipientId }) {
  const trace = createTrace('archive')
  const result = await dalArchiveInboxItem({ recipientId, trace })
  if (result) {
    invalidateCountUnreadCache() // bust cached counts after state change
    emit(EVENTS.INBOX_ARCHIVED, { recipientId })
  }
  return result
}
