// ============================================================
// Notifications Engine — Preference Model
// ============================================================

/**
 * Transform a raw DB row from notification.preferences into a domain object.
 *
 * @param {Object} row
 * @returns {import('../types/index.js').Preference}
 */
export function PreferenceModel(row) {
  return {
    id: row.id,
    ownerDomain: row.owner_domain,
    ownerKind: row.owner_kind,
    ownerActorId: row.owner_actor_id ?? null,
    ownerUserId: row.owner_user_id ?? null,
    ownerUserAppAccountId: row.owner_user_app_account_id ?? null,
    eventKey: row.event_key ?? null,
    sourceDomain: row.source_domain ?? null,
    channel: row.channel,
    isEnabled: row.is_enabled ?? true,
    muteUntil: row.mute_until ?? null,
    frequency: row.frequency ?? 'immediate',
    quietHours: row.quiet_hours ?? {},
    meta: row.meta ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
