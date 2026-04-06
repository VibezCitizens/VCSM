// src/model/Account.model.js

/**
 * @param {Object} raw - platform.user_app_accounts row or v_user_app_context row
 * @returns {import('../types/index.js').DomainAccount}
 */
export function AccountModel(raw) {
  return {
    id:          raw.id ?? raw.user_app_account_id,
    userId:      raw.user_id,
    appId:       raw.app_id,
    appKey:      raw.app_key ?? null,
    status:      raw.status ?? raw.app_account_status,
    activatedAt: raw.activated_at ?? null,
    lastSeenAt:  raw.last_seen_at ?? null,
  }
}
