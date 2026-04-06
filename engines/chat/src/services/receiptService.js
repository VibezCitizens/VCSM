// src/services/receiptService.js
// ============================================================
// Receipt Service
// ------------------------------------------------------------
// Encapsulates domain logic for message delivery and read receipts.
//
// Schema: chat.message_receipts
//   PK: (message_id, actor_id)
//   Columns: message_id, actor_id, status ('delivered'|'read'),
//            delivered_at, seen_at, hidden_at, meta,
//            created_at, updated_at
//
// Note: NO conversation_id column on this table.
//       conversation_id is only needed for outbox event payload.
//
// Services are called by controllers.
// Services must not call hooks, components, or screens.
// ============================================================

import { upsertMessageReceiptDAL } from '../dal/messageReceipts.write.dal.js'
import { EVENTS } from '../events.js'
import { publishDomainEvent } from './domainEventService.js'

/**
 * Upsert a delivery receipt for a message + actor pair.
 * Sets status = 'delivered' and records delivered_at.
 *
 * @param {Object} params
 * @param {string} params.messageId
 * @param {string} params.actorId
 * @param {string} params.conversationId  - for outbox payload only
 * @returns {Promise<true>}
 */
export async function markDelivered({ messageId, actorId, conversationId }) {
  const now = new Date().toISOString()

  await upsertMessageReceiptDAL({
    messageId,
    actorId,
    status: 'delivered',
    deliveredAt: now,
  })

  return true
}

/**
 * Upsert a read receipt for a message + actor pair.
 * Sets status = 'read', records delivered_at + seen_at,
 * and emits a receipt.read outbox event.
 *
 * @param {Object} params
 * @param {string} params.messageId
 * @param {string} params.actorId
 * @param {string} params.conversationId  - for outbox payload only
 * @returns {Promise<true>}
 */
export async function markRead({ messageId, actorId, conversationId }) {
  const now = new Date().toISOString()

  await upsertMessageReceiptDAL({
    messageId,
    actorId,
    status: 'read',
    deliveredAt: now,
    seenAt: now,
  })

  await publishDomainEvent({
    eventName: EVENTS.RECEIPT_READ,
    aggregateType: 'receipt',
    aggregateId: messageId,
    conversationId,
    messageId,
    payload: {
      messageId,
      actorId,
      conversationId,
      seenAt: now,
    },
  })

  return true
}
