import {
  fetchPendingOutboxEventsDAL,
  markOutboxEventFailedDAL,
  markOutboxEventPublishedDAL,
} from '../dal/outbox.write.dal.js'

function mapOutboxRow(row) {
  if (!row) return null

  return {
    id: row.id,
    eventName: row.event_name,
    version: row.event_version,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    conversationId: row.conversation_id ?? null,
    messageId: row.message_id ?? null,
    payload: row.payload ?? {},
    headers: row.headers ?? {},
    status: row.status,
    attempts: Number(row.attempts || 0),
    availableAt: row.available_at ?? null,
    processedAt: row.processed_at ?? null,
    createdAt: row.created_at,
  }
}

export async function fetchPendingOutboxEvents(options) {
  const rows = await fetchPendingOutboxEventsDAL(options)
  return rows.map(mapOutboxRow).filter(Boolean)
}

export async function markOutboxEventPublished({ outboxEventId }) {
  return markOutboxEventPublishedDAL({ outboxEventId })
}

export async function markOutboxEventFailed({ outboxEventId, lastError }) {
  return markOutboxEventFailedDAL({ outboxEventId, lastError })
}
