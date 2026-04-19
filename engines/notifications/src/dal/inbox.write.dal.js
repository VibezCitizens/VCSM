// ============================================================
// Notifications Engine — Inbox Write DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Create an inbox item for a recipient.
 *
 * @param {Object} params
 * @param {string} params.recipientId
 * @param {Object} [params.trace]
 * @returns {Promise<Object>}
 */
export async function dalInsertInboxItem({ recipientId, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({ step: 'INBOX_INSERT_START', status: 'start' })

  const { data, error } = await supabase
    .schema('notification')
    .rpc('insert_inbox_item', {
      p_recipient_id: recipientId,
    })
    .single()

  if (error) {
    trace?.report?.({ step: 'INBOX_INSERT_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({ step: 'INBOX_INSERT_SUCCESS', status: 'success' })
  return data
}

/**
 * Mark inbox items as seen by recipient IDs.
 *
 * @param {Object} params
 * @param {string[]} params.recipientIds
 * @param {Object} [params.trace]
 * @returns {Promise<number>} count of updated rows
 */
export async function dalMarkInboxSeen({ recipientIds, trace = null }) {
  if (!recipientIds || recipientIds.length === 0) return 0

  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .schema('notification')
    .from('inbox_items')
    .update({ is_seen: true, seen_at: now, updated_at: now })
    .in('recipient_id', recipientIds)
    .eq('is_seen', false)
    .select('recipient_id')

  if (error) {
    trace?.report?.({ step: 'INBOX_MARK_SEEN_ERROR', status: 'error', error })
    throw error
  }

  return data?.length ?? 0
}

/**
 * Mark a single inbox item as read.
 *
 * @param {Object} params
 * @param {string} params.recipientId
 * @param {Object} [params.trace]
 * @returns {Promise<Object|null>}
 */
export async function dalMarkInboxRead({ recipientId, trace = null }) {
  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .schema('notification')
    .from('inbox_items')
    .update({ is_read: true, read_at: now, is_seen: true, seen_at: now, updated_at: now })
    .eq('recipient_id', recipientId)
    .select('recipient_id, is_read, read_at')
    .single()

  if (error) {
    trace?.report?.({ step: 'INBOX_MARK_READ_ERROR', status: 'error', error })
    throw error
  }

  return data
}

/**
 * Dismiss an inbox item.
 *
 * @param {Object} params
 * @param {string} params.recipientId
 * @param {Object} [params.trace]
 * @returns {Promise<Object|null>}
 */
export async function dalDismissInboxItem({ recipientId, trace = null }) {
  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .schema('notification')
    .from('inbox_items')
    .update({ is_dismissed: true, dismissed_at: now, updated_at: now })
    .eq('recipient_id', recipientId)
    .select('recipient_id, is_dismissed, dismissed_at')
    .single()

  if (error) {
    trace?.report?.({ step: 'INBOX_DISMISS_ERROR', status: 'error', error })
    throw error
  }

  return data
}

/**
 * Archive an inbox item.
 *
 * @param {Object} params
 * @param {string} params.recipientId
 * @param {Object} [params.trace]
 * @returns {Promise<Object|null>}
 */
export async function dalArchiveInboxItem({ recipientId, trace = null }) {
  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .schema('notification')
    .from('inbox_items')
    .update({ archived_at: now, updated_at: now })
    .eq('recipient_id', recipientId)
    .select('recipient_id, archived_at')
    .single()

  if (error) {
    trace?.report?.({ step: 'INBOX_ARCHIVE_ERROR', status: 'error', error })
    throw error
  }

  return data
}
