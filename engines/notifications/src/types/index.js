// ============================================================
// Notifications Engine — Type Definitions (JSDoc)
// ============================================================

// --- Source Domains ---

/**
 * @typedef {'vc' | 'vport' | 'learning' | 'platform' | 'notification'} SourceDomain
 */

/**
 * Domains allowed as recipient_domain in notification.recipients.
 * Constrained by DB CHECK: ('vc', 'learning', 'platform').
 * 'vport' is NOT allowed — vport actors use recipient_domain 'vc'.
 * Extend this typedef only if a DB migration explicitly adds 'vport' to the CHECK constraint.
 *
 * @typedef {'vc' | 'learning' | 'platform'} RecipientDomain
 */

/**
 * @typedef {'in_app' | 'email' | 'sms' | 'push' | 'webhook'} DeliveryChannel
 */

/**
 * @typedef {'actor' | 'user' | 'app_account' | 'broadcast_group'} RecipientKind
 */

/**
 * @typedef {'private' | 'app' | 'public'} EventVisibility
 */

/**
 * @typedef {'pending' | 'delivered' | 'failed' | 'cancelled'} RecipientStatus
 */

/**
 * @typedef {'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'cancelled'} DeliveryAttemptStatus
 */

/**
 * @typedef {'immediate' | 'batched' | 'digest' | 'disabled'} PreferenceFrequency
 */

// --- Event Types ---

/**
 * @typedef {Object} EventCategory
 * @property {string}  key
 * @property {string}  label
 * @property {string|null} description
 * @property {number}  sortOrder
 * @property {boolean} isActive
 * @property {string}  createdAt
 * @property {string}  updatedAt
 */

/**
 * @typedef {Object} EventType
 * @property {string}      eventKey
 * @property {string|null} categoryKey
 * @property {SourceDomain} sourceDomain
 * @property {string}      label
 * @property {string|null} description
 * @property {number}      defaultPriority
 * @property {boolean}     supportsInApp
 * @property {boolean}     supportsEmail
 * @property {boolean}     supportsSms
 * @property {boolean}     supportsPush
 * @property {boolean}     supportsWebhook
 * @property {boolean}     isActive
 * @property {string}      createdAt
 * @property {string}      updatedAt
 */

// --- Core Entities ---

/**
 * @typedef {Object} NotificationEvent
 * @property {string}      id
 * @property {string}      eventKey
 * @property {SourceDomain} sourceDomain
 * @property {string|null} sourceActorId
 * @property {string|null} sourceUserId
 * @property {SourceDomain|null} objectDomain
 * @property {string|null} objectType
 * @property {string|null} objectId
 * @property {string|null} parentObjectType
 * @property {string|null} parentObjectId
 * @property {string|null} appId
 * @property {string|null} realmId
 * @property {EventVisibility} visibility
 * @property {Object}      payload
 * @property {string}      createdAt
 */

/**
 * Input for publishing a new event. ID and createdAt are auto-generated.
 *
 * @typedef {Object} PublishEventInput
 * @property {string}      eventKey
 * @property {SourceDomain} sourceDomain
 * @property {string|null} [sourceActorId]
 * @property {string|null} [sourceUserId]
 * @property {SourceDomain|null} [objectDomain]
 * @property {string|null} [objectType]
 * @property {string|null} [objectId]
 * @property {string|null} [parentObjectType]
 * @property {string|null} [parentObjectId]
 * @property {string|null} [appId]
 * @property {string|null} [realmId]
 * @property {EventVisibility} [visibility]
 * @property {Object}      [payload]
 */

/**
 * @typedef {Object} Recipient
 * @property {string}      id
 * @property {string}      eventId
 * @property {RecipientDomain} recipientDomain
 * @property {RecipientKind} recipientKind
 * @property {string|null} recipientActorId
 * @property {string|null} recipientUserId
 * @property {string|null} recipientUserAppAccountId
 * @property {DeliveryChannel} deliveryChannel
 * @property {string}      inboxBucket
 * @property {number}      priority
 * @property {RecipientStatus} status
 * @property {string|null} errorMessage
 * @property {string}      createdAt
 * @property {string|null} deliveredAt
 */

/**
 * Input for creating a recipient row.
 *
 * @typedef {Object} RecipientInput
 * @property {RecipientDomain} recipientDomain
 * @property {RecipientKind} recipientKind
 * @property {string|null} [recipientActorId]
 * @property {string|null} [recipientUserId]
 * @property {string|null} [recipientUserAppAccountId]
 * @property {DeliveryChannel} [deliveryChannel]
 * @property {string} [inboxBucket]
 * @property {number} [priority]
 */

/**
 * @typedef {Object} RenderedNotification
 * @property {string}      recipientId
 * @property {string|null} templateId
 * @property {string}      locale
 * @property {string|null} title
 * @property {string|null} body
 * @property {string|null} ctaLabel
 * @property {string|null} linkPath
 * @property {string|null} imageUrl
 * @property {string|null} icon
 * @property {Object}      renderContext
 * @property {string}      renderedAt
 * @property {string}      updatedAt
 */

/**
 * @typedef {Object} InboxItem
 * @property {string}      recipientId
 * @property {boolean}     isSeen
 * @property {string|null} seenAt
 * @property {boolean}     isRead
 * @property {string|null} readAt
 * @property {boolean}     isOpened
 * @property {string|null} openedAt
 * @property {boolean}     isDismissed
 * @property {string|null} dismissedAt
 * @property {boolean}     badgeCounted
 * @property {string|null} archivedAt
 * @property {string|null} snoozedUntil
 * @property {string}      createdAt
 * @property {string}      updatedAt
 */

/**
 * @typedef {Object} DeliveryAttempt
 * @property {string}      id
 * @property {string}      recipientId
 * @property {number}      attemptNo
 * @property {DeliveryChannel} channel
 * @property {string|null} provider
 * @property {string|null} providerMessageId
 * @property {DeliveryAttemptStatus} status
 * @property {Object}      requestPayload
 * @property {Object}      responsePayload
 * @property {string|null} errorCode
 * @property {string|null} errorMessage
 * @property {string|null} startedAt
 * @property {string|null} finishedAt
 * @property {string}      createdAt
 */

/**
 * @typedef {Object} Preference
 * @property {string}      id
 * @property {SourceDomain} ownerDomain
 * @property {string}      ownerKind
 * @property {string|null} ownerActorId
 * @property {string|null} ownerUserId
 * @property {string|null} ownerUserAppAccountId
 * @property {string|null} eventKey
 * @property {SourceDomain|null} sourceDomain
 * @property {DeliveryChannel} channel
 * @property {boolean}     isEnabled
 * @property {string|null} muteUntil
 * @property {PreferenceFrequency} frequency
 * @property {Object}      quietHours
 * @property {Object}      meta
 * @property {string}      createdAt
 * @property {string}      updatedAt
 */

/**
 * @typedef {Object} Template
 * @property {string}      id
 * @property {string}      templateKey
 * @property {SourceDomain} sourceDomain
 * @property {DeliveryChannel} channel
 * @property {string}      locale
 * @property {number}      version
 * @property {string}      name
 * @property {string|null} titleTemplate
 * @property {string|null} bodyTemplate
 * @property {string|null} ctaLabelTemplate
 * @property {string|null} defaultLinkPath
 * @property {string|null} defaultImageUrl
 * @property {string|null} defaultIcon
 * @property {Object[]}    variables
 * @property {Object}      meta
 * @property {boolean}     isActive
 * @property {string}      createdAt
 * @property {string}      updatedAt
 */

// --- Enriched / Composed Types ---

/**
 * Full notification ready for inbox display — joins event + recipient + rendered + inbox state.
 *
 * @typedef {Object} InboxNotification
 * @property {string}      recipientId
 * @property {string}      eventId
 * @property {string}      eventKey
 * @property {SourceDomain} sourceDomain
 * @property {string|null} sourceActorId
 * @property {string|null} objectType
 * @property {string|null} objectId
 * @property {Object}      payload
 * @property {string}      eventCreatedAt
 * @property {DeliveryChannel} deliveryChannel
 * @property {string}      inboxBucket
 * @property {number}      priority
 * @property {RecipientStatus} status
 * @property {string|null} title
 * @property {string|null} body
 * @property {string|null} ctaLabel
 * @property {string|null} linkPath
 * @property {string|null} imageUrl
 * @property {string|null} icon
 * @property {boolean}     isSeen
 * @property {boolean}     isRead
 * @property {boolean}     isOpened
 * @property {boolean}     isDismissed
 * @property {boolean}     badgeCounted
 * @property {string|null} archivedAt
 * @property {string|null} snoozedUntil
 */

export {}
