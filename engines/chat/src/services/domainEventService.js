import { emit, createEventEnvelope } from '../events.js'
import { insertOutboxEventDAL } from '../dal/outbox.write.dal.js'
import { getConfig } from '../config.js'

export async function publishDomainEvent({
  eventName,
  payload = {},
  version = 1,
  source = 'chat',
  aggregateType = null,
  aggregateId = null,
  conversationId = null,
  messageId = null,
  headers = {},
  emitInMemory = true,
}) {
  const envelope = createEventEnvelope(eventName, payload, {
    version,
    source,
  })

  let outboxEvent = null

  // Outbox insert: only attempt if the engine is configured to write outbox events.
  // On client-side (browser), RLS blocks direct INSERT to chat.outbox_events → 403.
  // The send_message_atomic RPC handles its own outbox insert server-side.
  // Other events (edit, delete, reactions, receipts) emit in-memory only from the client.
  // A server-side worker can enable outbox writes by setting config.enableOutboxWrites = true.
  const enableOutbox = getConfig().enableOutboxWrites === true

  if (enableOutbox && aggregateType && aggregateId) {
    try {
      outboxEvent = await insertOutboxEventDAL({
        eventName: envelope.eventName,
        eventVersion: envelope.version,
        aggregateType,
        aggregateId,
        conversationId,
        messageId,
        payload: envelope.payload,
        headers,
      })
    } catch (error) {
      // [BUGSBUNNY] Dev-only outbox write trace — remove after root cause confirmed
      if (typeof window !== 'undefined' && import.meta.env?.DEV) {
        console.warn('[BUGSBUNNY outbox] INSERT failed for', eventName, error?.message ?? error)
      }
    }
  } else if (typeof window !== 'undefined' && import.meta.env?.DEV && aggregateType && aggregateId) {
    console.log('[BUGSBUNNY outbox] Skipped outbox INSERT for', eventName, '(client-side, enableOutboxWrites=false)')
  }

  if (emitInMemory) {
    emit(envelope.eventName, envelope.payload, {
      version: envelope.version,
      occurredAt: envelope.occurredAt,
      source: envelope.source,
    })
  }

  return { envelope, outboxEvent }
}
