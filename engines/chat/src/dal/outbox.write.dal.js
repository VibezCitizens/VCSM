// src/dal/outbox.write.dal.js
// ============================================================
// Outbox Events Write DAL
// ------------------------------------------------------------
// - RAW database writes only
// - Explicit column usage (NO select '*')
// - No business rules
// - No permission checks
//
// Schema: chat.outbox_events
//   Columns: id, event_name, event_version, aggregate_type (required),
//            aggregate_id (required), conversation_id, message_id,
//            payload, headers, status, attempts, available_at,
//            processed_at, failed_at, last_error, created_at, updated_at
//
//   status lifecycle: pending → processing → published | failed
//
// The outbox table is a durable event log. External workers
// poll/subscribe and process events asynchronously.
// Every important domain action must write an outbox row.
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Insert an outbox event row.
 *
 * @param {Object}      params
 * @param {string}      params.eventName         - e.g. 'message.sent'
 * @param {string}      params.aggregateType     - 'conversation'|'message'|'member'|'receipt'|'inbox'
 * @param {string}      params.aggregateId       - UUID of the primary aggregate
 * @param {number}      [params.eventVersion=1]  - payload schema version
 * @param {string|null} [params.conversationId]  - denormalised for worker queries
 * @param {string|null} [params.messageId]       - denormalised for worker queries
 * @param {Object}      [params.payload={}]      - domain event payload
 * @param {Object}      [params.headers={}]      - optional routing headers
 * @returns {Promise<Object>} Raw outbox row
 */
export async function insertOutboxEventDAL({
  eventName,
  aggregateType,
  aggregateId,
  eventVersion = 1,
  conversationId = null,
  messageId = null,
  payload = {},
  headers = {},
}) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('outbox_events')
    .insert({
      event_name: eventName,
      event_version: eventVersion,
      aggregate_type: aggregateType,
      aggregate_id: aggregateId,
      conversation_id: conversationId,
      message_id: messageId,
      payload,
      headers,
      status: 'pending',
    })
    .select(`
      id,
      event_name,
      event_version,
      aggregate_type,
      aggregate_id,
      conversation_id,
      message_id,
      payload,
      headers,
      status,
      attempts,
      available_at,
      processed_at,
      created_at
    `)
    .single()

  if (error) throw error

  return data
}

/**
 * Mark an outbox event as published (successfully processed).
 * Called by external workers after successful handling.
 *
 * @param {Object} params
 * @param {string} params.outboxEventId
 * @returns {Promise<true>}
 */
export async function markOutboxEventPublishedDAL({ outboxEventId }) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('outbox_events')
    .update({
      status: 'published',
      processed_at: new Date().toISOString(),
    })
    .eq('id', outboxEventId)
    .eq('status', 'processing')

  if (error) throw error

  return true
}

/**
 * Mark an outbox event as failed after exhausting retries.
 *
 * @param {Object} params
 * @param {string} params.outboxEventId
 * @param {string} params.lastError
 * @returns {Promise<true>}
 */
export async function markOutboxEventFailedDAL({ outboxEventId, lastError }) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('outbox_events')
    .update({
      status: 'failed',
      failed_at: new Date().toISOString(),
      last_error: lastError,
    })
    .eq('id', outboxEventId)

  if (error) throw error

  return true
}

/**
 * Fetch pending outbox events available for processing.
 * Workers call this to claim a batch of work.
 *
 * @param {Object} [params]
 * @param {number} [params.limit=50]
 * @returns {Promise<Object[]>}
 */
export async function fetchPendingOutboxEventsDAL({ limit = 50 } = {}) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('outbox_events')
    .select(`
      id,
      event_name,
      event_version,
      aggregate_type,
      aggregate_id,
      conversation_id,
      message_id,
      payload,
      headers,
      status,
      attempts,
      available_at,
      created_at
    `)
    .eq('status', 'pending')
    .lte('available_at', new Date().toISOString())
    .order('available_at', { ascending: true })
    .limit(limit)

  if (error) throw error

  return data ?? []
}
