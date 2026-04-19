// ============================================================
// Notifications Engine — DeliveryAttempts Write DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Record a delivery attempt for a recipient.
 *
 * @param {Object} params
 * @param {string} params.recipientId
 * @param {number} [params.attemptNo]
 * @param {string} params.channel
 * @param {string|null} [params.provider]
 * @param {string} [params.status]
 * @param {Object} [params.requestPayload]
 * @param {Object} [params.trace]
 * @returns {Promise<Object>}
 */
export async function dalInsertDeliveryAttempt({
  recipientId,
  attemptNo = 1,
  channel,
  provider = null,
  status = 'queued',
  requestPayload = {},
  trace = null,
}) {
  const supabase = getSupabaseClient()

  trace?.report?.({ step: 'DELIVERY_ATTEMPT_INSERT_START', status: 'start' })

  const { data, error } = await supabase
    .schema('notification')
    .rpc('insert_delivery_attempt', {
      p_recipient_id: recipientId,
      p_attempt_no: attemptNo,
      p_channel: channel,
      p_provider: provider,
      p_status: status,
      p_request_payload: requestPayload,
    })
    .single()

  if (error) {
    trace?.report?.({ step: 'DELIVERY_ATTEMPT_INSERT_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({ step: 'DELIVERY_ATTEMPT_INSERT_SUCCESS', status: 'success', attemptId: data.id })
  return data
}

/**
 * Update delivery attempt status and response.
 *
 * @param {Object} params
 * @param {string} params.attemptId
 * @param {string} params.status
 * @param {string|null} [params.providerMessageId]
 * @param {Object} [params.responsePayload]
 * @param {string|null} [params.errorCode]
 * @param {string|null} [params.errorMessage]
 * @param {Object} [params.trace]
 * @returns {Promise<Object|null>}
 */
export async function dalUpdateDeliveryAttempt({
  attemptId,
  status,
  providerMessageId = null,
  responsePayload = {},
  errorCode = null,
  errorMessage = null,
  trace = null,
}) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('notification')
    .rpc('update_delivery_attempt', {
      p_attempt_id: attemptId,
      p_status: status,
      p_provider_message_id: providerMessageId,
      p_response_payload: responsePayload,
      p_error_code: errorCode,
      p_error_message: errorMessage,
    })
    .single()

  if (error) {
    trace?.report?.({ step: 'DELIVERY_ATTEMPT_UPDATE_ERROR', status: 'error', error })
    throw error
  }

  return data
}
