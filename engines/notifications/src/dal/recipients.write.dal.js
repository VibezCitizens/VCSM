// ============================================================
// Notifications Engine — Recipients Write DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Insert one or more recipient rows for an event.
 *
 * @param {Object} params
 * @param {string} params.eventId
 * @param {import('../types/index.js').RecipientInput[]} params.recipients
 * @param {Object} [params.trace]
 * @returns {Promise<Object[]>}
 */
export async function dalInsertRecipients({ eventId, recipients, trace = null }) {
  if (!recipients || recipients.length === 0) return []

  const supabase = getSupabaseClient()

  trace?.report?.({ step: 'RECIPIENTS_INSERT_START', status: 'start', count: recipients.length })

  const rows = recipients.map((r) => ({
    recipient_domain: r.recipientDomain,
    recipient_kind: r.recipientKind,
    recipient_actor_id: r.recipientActorId ?? null,
    recipient_user_id: r.recipientUserId ?? null,
    recipient_user_app_account_id: r.recipientUserAppAccountId ?? null,
    delivery_channel: r.deliveryChannel ?? 'in_app',
    inbox_bucket: r.inboxBucket ?? 'default',
    priority: r.priority ?? 3,
  }))

  const { data, error } = await supabase
    .schema('notification')
    .rpc('insert_recipients', {
      p_event_id: eventId,
      p_recipients: rows,
    })

  if (error) {
    trace?.report?.({ step: 'RECIPIENTS_INSERT_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({ step: 'RECIPIENTS_INSERT_SUCCESS', status: 'success', count: data?.length ?? 0 })
  return data ?? []
}

/**
 * Update recipient status.
 *
 * @param {Object} params
 * @param {string} params.recipientId
 * @param {string} params.status
 * @param {string|null} [params.errorMessage]
 * @param {Object} [params.trace]
 * @returns {Promise<Object|null>}
 */
export async function dalUpdateRecipientStatus({ recipientId, status, errorMessage = null, trace = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('notification')
    .rpc('update_recipient_status', {
      p_recipient_id: recipientId,
      p_status: status,
      p_error_message: errorMessage,
    })
    .single()

  if (error) {
    trace?.report?.({ step: 'RECIPIENT_STATUS_UPDATE_ERROR', status: 'error', error })
    throw error
  }

  return data
}
