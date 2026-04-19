// ============================================================
// Notifications Engine — EventTypes Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const EVENT_TYPE_COLUMNS = `
  event_key, category_key, source_domain, label, description,
  default_priority, supports_in_app, supports_email, supports_sms,
  supports_push, supports_webhook, is_active, created_at, updated_at
`

/**
 * Fetch an event type definition by key.
 *
 * @param {Object} params
 * @param {string} params.eventKey
 * @param {Object} [params.trace]
 * @returns {Promise<Object|null>}
 */
export async function dalGetEventType({ eventKey, trace = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('notification')
    .from('event_types')
    .select(EVENT_TYPE_COLUMNS)
    .eq('event_key', eventKey)
    .eq('is_active', true)
    .limit(1)

  if (error) {
    trace?.report?.({ step: 'EVENT_TYPE_READ_ERROR', status: 'error', error })
    throw error
  }

  return data?.[0] ?? null
}

/**
 * List all active event types, optionally filtered by source domain.
 *
 * @param {Object} [params]
 * @param {string} [params.sourceDomain]
 * @param {Object} [params.trace]
 * @returns {Promise<Object[]>}
 */
export async function dalListEventTypes({ sourceDomain = null, trace = null } = {}) {
  const supabase = getSupabaseClient()

  let query = supabase
    .schema('notification')
    .from('event_types')
    .select(EVENT_TYPE_COLUMNS)
    .eq('is_active', true)
    .order('event_key', { ascending: true })

  if (sourceDomain) {
    query = query.eq('source_domain', sourceDomain)
  }

  const { data, error } = await query

  if (error) {
    trace?.report?.({ step: 'EVENT_TYPES_LIST_ERROR', status: 'error', error })
    throw error
  }

  return data ?? []
}
