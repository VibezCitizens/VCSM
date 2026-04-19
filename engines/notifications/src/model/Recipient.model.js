// ============================================================
// Notifications Engine — Recipient Model
// ============================================================

/**
 * Transform a raw DB row from notification.recipients into a domain object.
 *
 * @param {Object} row
 * @returns {import('../types/index.js').Recipient}
 */
export function RecipientModel(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    recipientDomain: row.recipient_domain,
    recipientKind: row.recipient_kind,
    recipientActorId: row.recipient_actor_id ?? null,
    recipientUserId: row.recipient_user_id ?? null,
    recipientUserAppAccountId: row.recipient_user_app_account_id ?? null,
    deliveryChannel: row.delivery_channel ?? 'in_app',
    inboxBucket: row.inbox_bucket ?? 'default',
    priority: row.priority ?? 3,
    status: row.status ?? 'pending',
    errorMessage: row.error_message ?? null,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at ?? null,
  }
}
