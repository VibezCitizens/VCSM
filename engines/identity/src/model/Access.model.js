// src/model/Access.model.js

/**
 * @param {Object} raw - platform.user_app_access row
 * @returns {import('../types/index.js').DomainAccess}
 */
export function AccessModel(raw) {
  return {
    userId:    raw.user_id,
    appId:     raw.app_id,
    status:    raw.status,
    grantedAt: raw.granted_at ?? null,
    revokedAt: raw.revoked_at ?? null,
  }
}
