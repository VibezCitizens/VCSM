// ============================================================
// Notifications Engine — Events Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const EVENT_COLUMNS = `
  id, event_key, source_domain, source_actor_id, source_user_id,
  object_domain, object_type, object_id,
  parent_object_type, parent_object_id,
  app_id, realm_id, visibility, payload, created_at
`

/**
 * Fetch a single event by ID.
 *
 * @param {Object} params
 * @param {string} params.eventId
 * @param {Object} [params.trace]
 * @returns {Promise<Object|null>}
 */
export async function dalGetEventById({ eventId, trace = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('notification')
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('id', eventId)
    .limit(1)

  if (error) {
    trace?.report?.({ step: 'EVENT_BY_ID_ERROR', status: 'error', error })
    throw error
  }

  return data?.[0] ?? null
}
