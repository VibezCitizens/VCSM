// ============================================================
// Notifications Engine — Delivery Orchestrator Service
// ============================================================
// Orchestrates delivery per channel. in_app creates inbox items.
// Other channels create delivery attempts for future provider integration.

import { dalInsertInboxItem } from '../dal/inbox.write.dal.js'
import { dalInsertDeliveryAttempt, dalUpdateDeliveryAttempt } from '../dal/deliveryAttempts.write.dal.js'
import { dalUpdateRecipientStatus } from '../dal/recipients.write.dal.js'
import { emit, EVENTS } from '../events.js'

/**
 * Deliver a notification to a single recipient through their assigned channel.
 *
 * @param {Object} params
 * @param {Object} params.recipient — recipient row from DB
 * @param {Object} params.rendered — rendered content { title, body, linkPath, ... }
 * @param {Object} [params.trace]
 * @returns {Promise<{ success: boolean, channel: string, error?: string }>}
 */
export async function deliverToRecipient({ recipient, rendered, trace = null }) {
  const channel = recipient.delivery_channel ?? recipient.deliveryChannel ?? 'in_app'
  const recipientId = recipient.id

  trace?.report?.({ step: 'DELIVERY_START', status: 'start', channel, recipientId })

  try {
    if (channel === 'in_app') {
      return await deliverInApp({ recipientId, trace })
    }

    // For email/sms/push/webhook — create delivery attempt record
    return await deliverExternal({ recipientId, channel, rendered, trace })
  } catch (err) {
    trace?.report?.({ step: 'DELIVERY_FAILED', status: 'error', channel, error: err })

    // Mark recipient as failed
    try {
      await dalUpdateRecipientStatus({ recipientId, status: 'failed', errorMessage: err.message, trace })
    } catch (_) {}

    emit(EVENTS.DELIVERY_FAILED, { recipientId, channel, error: err.message })

    return { success: false, channel, error: err.message }
  }
}

/**
 * In-app delivery: create inbox item + mark recipient as delivered.
 */
async function deliverInApp({ recipientId, trace }) {
  // Create inbox item
  await dalInsertInboxItem({ recipientId, trace })

  // Mark recipient as delivered
  await dalUpdateRecipientStatus({ recipientId, status: 'delivered', trace })

  emit(EVENTS.INBOX_ITEM_CREATED, { recipientId })
  emit(EVENTS.DELIVERY_SUCCEEDED, { recipientId, channel: 'in_app' })

  trace?.report?.({ step: 'DELIVERY_IN_APP_SUCCESS', status: 'success', recipientId })
  return { success: true, channel: 'in_app' }
}

/**
 * External delivery: record attempt for future provider integration.
 * Provider-specific logic (email sending, push notification, etc.) is NOT
 * implemented here — this creates the attempt record so a delivery worker
 * or future provider hook can process it.
 */
async function deliverExternal({ recipientId, channel, rendered, trace }) {
  const attempt = await dalInsertDeliveryAttempt({
    recipientId,
    channel,
    provider: null,
    status: 'queued',
    requestPayload: {
      title: rendered.title,
      body: rendered.body,
      linkPath: rendered.linkPath,
    },
    trace,
  })

  // Mark the attempt as "sent" (placeholder — real providers update this)
  await dalUpdateDeliveryAttempt({
    attemptId: attempt.id,
    status: 'sent',
    trace,
  })

  // Mark recipient as delivered
  await dalUpdateRecipientStatus({ recipientId, status: 'delivered', trace })

  emit(EVENTS.DELIVERY_ATTEMPTED, { recipientId, channel, attemptId: attempt.id })

  trace?.report?.({ step: 'DELIVERY_EXTERNAL_QUEUED', status: 'success', channel, attemptId: attempt.id })
  return { success: true, channel }
}
