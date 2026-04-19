// ============================================================
// Notifications Engine — Event Model
// ============================================================

/**
 * Transform a raw DB row from notification.events into a domain object.
 *
 * @param {Object} row
 * @returns {import('../types/index.js').NotificationEvent}
 */
export function EventModel(row) {
  return {
    id: row.id,
    eventKey: row.event_key,
    sourceDomain: row.source_domain,
    sourceActorId: row.source_actor_id ?? null,
    sourceUserId: row.source_user_id ?? null,
    objectDomain: row.object_domain ?? null,
    objectType: row.object_type ?? null,
    objectId: row.object_id ?? null,
    parentObjectType: row.parent_object_type ?? null,
    parentObjectId: row.parent_object_id ?? null,
    appId: row.app_id ?? null,
    realmId: row.realm_id ?? null,
    visibility: row.visibility ?? 'private',
    payload: row.payload ?? {},
    createdAt: row.created_at,
  }
}
