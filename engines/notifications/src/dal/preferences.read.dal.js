// ============================================================
// Notifications Engine — Preferences Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const PREFERENCE_COLUMNS = `
  id, owner_domain, owner_kind, owner_actor_id, owner_user_id,
  owner_user_app_account_id, event_key, source_domain, channel,
  is_enabled, mute_until, frequency, quiet_hours, meta,
  created_at, updated_at
`

/**
 * List all preferences for an actor.
 *
 * @param {Object} params
 * @param {string} params.ownerActorId
 * @param {string} [params.ownerDomain]
 * @param {Object} [params.trace]
 * @returns {Promise<Object[]>}
 */
export async function dalListPreferencesByActor({ ownerActorId, ownerDomain = null, trace = null }) {
  const supabase = getSupabaseClient()

  let query = supabase
    .schema('notification')
    .from('preferences')
    .select(PREFERENCE_COLUMNS)
    .eq('owner_actor_id', ownerActorId)

  if (ownerDomain) {
    query = query.eq('owner_domain', ownerDomain)
  }

  const { data, error } = await query

  if (error) {
    trace?.report?.({ step: 'PREFERENCES_LIST_ERROR', status: 'error', error })
    throw error
  }

  return data ?? []
}

/**
 * Find a specific preference for an actor + event + channel.
 *
 * @param {Object} params
 * @param {string} params.ownerActorId
 * @param {string|null} [params.eventKey]
 * @param {string} params.channel
 * @param {Object} [params.trace]
 * @returns {Promise<Object|null>}
 */
export async function dalGetPreference({ ownerActorId, eventKey = null, channel, trace = null }) {
  const supabase = getSupabaseClient()

  let query = supabase
    .schema('notification')
    .from('preferences')
    .select(PREFERENCE_COLUMNS)
    .eq('owner_actor_id', ownerActorId)
    .eq('channel', channel)

  if (eventKey) {
    query = query.eq('event_key', eventKey)
  } else {
    query = query.is('event_key', null)
  }

  const { data, error } = await query.limit(1)

  if (error) {
    trace?.report?.({ step: 'PREFERENCE_GET_ERROR', status: 'error', error })
    throw error
  }

  return data?.[0] ?? null
}
