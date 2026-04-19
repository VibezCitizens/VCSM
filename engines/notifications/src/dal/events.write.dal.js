// ============================================================
// Notifications Engine — Events Write DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Insert a new notification event.
 *
 * @param {Object} params
 * @param {string} params.eventKey
 * @param {string} params.sourceDomain
 * @param {string|null} [params.sourceActorId]
 * @param {string|null} [params.sourceUserId]
 * @param {string|null} [params.objectDomain]
 * @param {string|null} [params.objectType]
 * @param {string|null} [params.objectId]
 * @param {string|null} [params.parentObjectType]
 * @param {string|null} [params.parentObjectId]
 * @param {string|null} [params.appId]
 * @param {string|null} [params.realmId]
 * @param {string} [params.visibility]
 * @param {Object} [params.payload]
 * @param {Object} [params.trace]
 * @returns {Promise<Object>}
 */
export async function dalInsertEvent({
  eventKey,
  sourceDomain,
  sourceActorId = null,
  sourceUserId = null,
  objectDomain = null,
  objectType = null,
  objectId = null,
  parentObjectType = null,
  parentObjectId = null,
  appId = null,
  realmId = null,
  visibility = 'private',
  payload = {},
  trace = null,
}) {
  const supabase = getSupabaseClient()

  trace?.report?.({ step: 'EVENT_INSERT_START', status: 'start' })

  const { data, error } = await supabase
    .schema('notification')
    .rpc('create_event', {
      p_event_key: eventKey,
      p_source_domain: sourceDomain,
      p_source_actor_id: sourceActorId,
      p_source_user_id: sourceUserId,
      p_object_domain: objectDomain,
      p_object_type: objectType,
      p_object_id: objectId,
      p_parent_object_type: parentObjectType,
      p_parent_object_id: parentObjectId,
      p_app_id: appId,
      p_realm_id: realmId,
      p_visibility: visibility,
      p_payload: payload,
    })
    .single()

  if (error) {
    trace?.report?.({ step: 'EVENT_INSERT_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({ step: 'EVENT_INSERT_SUCCESS', status: 'success', eventId: data.id })
  return data
}
