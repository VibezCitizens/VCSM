// ============================================================
// Notifications Engine — Recipients Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const RECIPIENT_COLUMNS = `
  id, event_id, recipient_domain, recipient_kind,
  recipient_actor_id, recipient_user_id, recipient_user_app_account_id,
  delivery_channel, inbox_bucket, priority, status,
  error_message, created_at, delivered_at
`

/**
 * List recipients for a given event.
 *
 * @param {Object} params
 * @param {string} params.eventId
 * @param {Object} [params.trace]
 * @returns {Promise<Object[]>}
 */
export async function dalListRecipientsByEvent({ eventId, trace = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('notification')
    .from('recipients')
    .select(RECIPIENT_COLUMNS)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) {
    trace?.report?.({ step: 'RECIPIENTS_BY_EVENT_ERROR', status: 'error', error })
    throw error
  }

  return data ?? []
}

/**
 * Get a single recipient by ID.
 *
 * @param {Object} params
 * @param {string} params.recipientId
 * @param {Object} [params.trace]
 * @returns {Promise<Object|null>}
 */
export async function dalGetRecipientById({ recipientId, trace = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('notification')
    .from('recipients')
    .select(RECIPIENT_COLUMNS)
    .eq('id', recipientId)
    .limit(1)

  if (error) {
    trace?.report?.({ step: 'RECIPIENT_BY_ID_ERROR', status: 'error', error })
    throw error
  }

  return data?.[0] ?? null
}
