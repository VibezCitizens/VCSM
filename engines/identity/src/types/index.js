// src/types/index.js
// ============================================================
// Identity Engine — Domain Type Definitions
// ============================================================

/**
 * @typedef {Object} DomainApp
 * @property {string}  id
 * @property {string}  key
 * @property {string}  name
 * @property {boolean} isActive
 * @property {string}  createdAt
 */

/**
 * @typedef {'pending'|'granted'|'revoked'|'suspended'} AccessStatus
 *
 * @typedef {Object} DomainAccess
 * @property {string}       userId
 * @property {string}       appId
 * @property {AccessStatus} status
 * @property {string|null}  grantedAt
 * @property {string|null}  revokedAt
 */

/**
 * @typedef {'provisioned'|'active'|'disabled'|'deleted'} AccountStatus
 *
 * @typedef {Object} DomainAccount
 * @property {string}        id
 * @property {string}        userId
 * @property {string}        appId
 * @property {string}        appKey
 * @property {AccountStatus} status
 * @property {string|null}   activatedAt
 * @property {string|null}   lastSeenAt
 */

/**
 * @typedef {'active'|'inactive'|'revoked'|'deleted'} ActorLinkStatus
 *
 * @typedef {Object} DomainActorLink
 * @property {string}          id
 * @property {string}          userAppAccountId
 * @property {string}          appId
 * @property {'learning'|'vc'} actorSource
 * @property {string}          actorId
 * @property {string|null}     actorKind
 * @property {boolean}         isPrimary
 * @property {boolean}         isSwitchable
 * @property {ActorLinkStatus} status
 * @property {string|null}     displayName
 * @property {string|null}     avatarUrl
 */

/**
 * @typedef {Object} DomainPreferences
 * @property {string}      userAppAccountId
 * @property {string|null} activeActorLinkId
 * @property {string|null} lastActorLinkId
 * @property {string|null} theme
 * @property {string|null} locale
 * @property {string|null} timezone
 */

/**
 * @typedef {'pending'|'in_progress'|'completed'|'skipped'} OnboardingStatus
 * @typedef {'active'|'suspended'|'disabled'|'pending_review'} AppAccountStatus
 *
 * @typedef {Object} DomainState
 * @property {string}           userAppAccountId
 * @property {OnboardingStatus} onboardingStatus
 * @property {AppAccountStatus} accountStatus
 * @property {string|null}      defaultDestinationKey
 * @property {string|null}      lastDestinationKey
 * @property {boolean}          requiresActorSelection
 * @property {boolean}          requiresOnboarding
 * @property {string|null}      suspendedReason
 * @property {string|null}      suspendedUntil
 * @property {string|null}      firstLoginAt
 * @property {string|null}      lastLoginAt
 */

/**
 * The fully resolved identity context returned to apps.
 *
 * @typedef {Object} AuthenticatedContext
 * @property {string}            userId
 * @property {string}            appId
 * @property {string}            appKey
 * @property {string}            userAppAccountId
 * @property {AccessStatus}      accessStatus
 * @property {AppAccountStatus}  accountStatus
 * @property {DomainActorLink[]} availableActors
 * @property {DomainActorLink|null} activeActor
 * @property {string[]}          roleKeys
 * @property {string[]}          capabilityKeys
 * @property {boolean}           requiresOnboarding
 * @property {boolean}           requiresActorSelection
 * @property {boolean}           isSuspended
 * @property {string|null}       defaultDestination
 */

export {}
