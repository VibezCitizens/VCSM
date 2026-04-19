// ============================================================
// Notifications Engine — DeliveryAttempt Model
// ============================================================

/**
 * Transform a raw DB row from notification.delivery_attempts into a domain object.
 *
 * @param {Object} row
 * @returns {import('../types/index.js').DeliveryAttempt}
 */
export function DeliveryAttemptModel(row) {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    attemptNo: row.attempt_no ?? 1,
    channel: row.channel,
    provider: row.provider ?? null,
    providerMessageId: row.provider_message_id ?? null,
    status: row.status ?? 'queued',
    requestPayload: row.request_payload ?? {},
    responsePayload: row.response_payload ?? {},
    errorCode: row.error_code ?? null,
    errorMessage: row.error_message ?? null,
    startedAt: row.started_at ?? null,
    finishedAt: row.finished_at ?? null,
    createdAt: row.created_at,
  }
}
