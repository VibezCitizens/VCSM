// src/services/messageService.js
// ============================================================
// Message Service
// ------------------------------------------------------------
// Encapsulates reusable domain logic around message lifecycle:
//   - idempotent send (client_id dedup)
//   - conversation sequence ordering
//   - message validation rules
//
// Services are called by controllers.
// Services must not call hooks, components, or screens.
// ============================================================

import { findMessageByClientId } from '../utils/idempotency.js'
import { sendMessageAtomicDAL } from '../dal/sendMessageAtomic.rpc.dal.js'
import { MessageModel } from '../model/Message.model.js'
import { EVENTS, emit, createEventEnvelope } from '../events.js'
import { publishDomainEvent } from './domainEventService.js'

/**
 * Attempt an idempotent message send via the atomic RPC.
 *
 * If a message with the same client_id already exists in this
 * conversation, the existing domain object is returned without
 * inserting a duplicate row. Otherwise the RPC atomically:
 *   1. Inserts the message (with conversation_seq)
 *   2. Updates conversation last_message pointers
 *   3. Fan-out updates inbox_entries for all members
 *   4. Inserts the outbox event
 *
 * @param {Object} params
 * @param {string}      params.conversationId
 * @param {string}      params.senderActorId
 * @param {string}      params.messageKind
 * @param {string|null} [params.body]
 * @param {string|null} [params.replyToMessageId]
 * @param {string|null} [params.clientId]
 * @param {Object}      [params.meta]
 * @returns {Promise<{ message: Object, isDuplicate: boolean }>}
 */
export async function idempotentSendMessage({
  conversationId,
  senderActorId,
  messageKind,
  body = null,
  replyToMessageId = null,
  clientId = null,
  meta = {},
  attachments = [],
}) {
  // Dedup check — if clientId provided and row already exists, return early
  if (clientId) {
    const existing = await findMessageByClientId({ clientId, conversationId })
    if (existing) {
      return { message: MessageModel(existing), isDuplicate: true }
    }
  }

  const row = await sendMessageAtomicDAL({
    conversationId,
    senderActorId,
    messageKind,
    body,
    replyToMessageId,
    clientId,
    meta,
    attachments,
  })

  return { message: MessageModel(row), isDuplicate: false }
}

/**
 * Validate that a message has sendable content.
 * Throws if both body and mediaUrl are absent.
 *
 * @param {Object} params
 * @param {string|null} params.body
 * @param {string|null} [params.mediaUrl]
 * @param {string} [params.messageKind='text']
 */
export function assertMessageHasContent({
  body,
  mediaUrl = null,
  messageKind = 'text',
}) {
  const hasBody = typeof body === 'string' && body.trim().length > 0
  const hasMedia = mediaUrl != null

  if (!hasBody && !hasMedia && messageKind === 'text') {
    throw new Error('[messageService] message must have a body')
  }
}

/**
 * Emit in-memory message.sent event for real-time subscribers.
 *
 * The durable outbox insert is handled by the send_message_atomic RPC.
 * This function only emits the in-memory event for live UI updates.
 *
 * @param {Object} params
 * @param {Object} params.message       - Domain message object
 * @param {string} params.conversationId
 * @param {string} params.senderActorId
 */
export function publishMessageSentEvent({
  message,
  conversationId,
  senderActorId,
}) {
  const envelope = createEventEnvelope(EVENTS.MESSAGE_SENT, {
    messageId: message.id,
    conversationId,
    senderActorId,
    messageKind: message.kind,
    message,
  })

  emit(envelope.eventName, envelope.payload, {
    version: envelope.version,
    occurredAt: envelope.occurredAt,
    source: envelope.source,
  })
}

/**
 * Publish a message.edited domain event and durable outbox handoff.
 *
 * @param {Object} params
 * @param {Object} params.message        - Updated domain message object
 * @param {string} params.editorActorId
 */
export async function publishMessageEditedEvent({ message, editorActorId }) {
  return publishDomainEvent({
    eventName: EVENTS.MESSAGE_EDITED,
    aggregateType: 'message',
    aggregateId: message.id,
    conversationId: message.conversationId,
    messageId: message.id,
    payload: {
      messageId: message.id,
      conversationId: message.conversationId,
      editorActorId,
      message,
    },
  })
}

/**
 * Publish either a message.deleted or message.hidden domain event.
 *
 * @param {Object} params
 * @param {string} params.messageId
 * @param {string} params.conversationId
 * @param {string} params.deletedByActorId
 * @param {'all'|'me'|'hard'} [params.scope='all']
 * @param {'message.deleted'|'message.hidden'} [params.eventName]
 */
export async function publishMessageLifecycleEvent({
  messageId,
  conversationId,
  deletedByActorId,
  scope = 'all',
  eventName = EVENTS.MESSAGE_DELETED,
  reason = null,
}) {
  return publishDomainEvent({
    eventName,
    aggregateType: 'message',
    aggregateId: messageId,
    conversationId,
    messageId,
    payload: {
      messageId,
      conversationId,
      actorId: deletedByActorId,
      scope,
      reason,
    },
  })
}
