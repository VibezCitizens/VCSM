// src/model/State.model.js

/**
 * @param {Object} raw - platform.user_app_state row
 * @returns {import('../types/index.js').DomainState}
 */
export function StateModel(raw) {
  return {
    userAppAccountId:     raw.user_app_account_id,
    onboardingStatus:     raw.onboarding_status,
    accountStatus:        raw.account_status,
    defaultDestinationKey: raw.default_destination_key ?? null,
    lastDestinationKey:   raw.last_destination_key ?? null,
    lastActorLinkId:      raw.last_actor_link_id ?? null,
    requiresActorSelection: raw.requires_actor_selection,
    requiresOnboarding:   raw.requires_onboarding,
    suspendedReason:      raw.suspended_reason ?? null,
    suspendedUntil:       raw.suspended_until ?? null,
    firstLoginAt:         raw.first_login_at ?? null,
    lastLoginAt:          raw.last_login_at ?? null,
  }
}
