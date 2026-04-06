// src/model/ActorLink.model.js

/**
 * @param {Object} raw - platform.user_app_actor_links row
 * @returns {import('../types/index.js').DomainActorLink}
 */
export function ActorLinkModel(raw) {
  return {
    id:                raw.id,
    userAppAccountId:  raw.user_app_account_id,
    appId:             raw.app_id,
    actorSource:       raw.actor_source,
    actorId:           raw.actor_id,
    actorKind:         raw.actor_kind ?? null,
    isPrimary:         raw.is_primary,
    isSwitchable:      raw.is_switchable,
    status:            raw.status,
    displayName:       raw.display_name_snapshot ?? null,
    avatarUrl:         raw.avatar_url_snapshot ?? null,
    meta:              raw.meta ?? null,
  }
}
