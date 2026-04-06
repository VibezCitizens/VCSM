// src/model/Preferences.model.js

/**
 * @param {Object} raw - platform.user_app_preferences row
 * @returns {import('../types/index.js').DomainPreferences}
 */
export function PreferencesModel(raw) {
  return {
    userAppAccountId:  raw.user_app_account_id,
    activeActorLinkId: raw.active_actor_link_id ?? null,
    lastActorLinkId:   raw.last_actor_link_id ?? null,
    theme:             raw.theme ?? null,
    locale:            raw.locale ?? null,
    timezone:          raw.timezone ?? null,
  }
}
