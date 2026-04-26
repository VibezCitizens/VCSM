// ============================================================
// Booking Engine — Domain Types (JSDoc)
// ============================================================

/**
 * @typedef {'pending'|'confirmed'|'completed'|'cancelled'|'no_show'|'hold'} BookingStatus
 * @typedef {'public'|'owner'|'admin'|'import'|'sync'} BookingSource
 * @typedef {'primary'|'staff'|'room'|'chair'|'equipment'} ResourceType
 * @typedef {'weekly'} AvailabilityRuleType
 * @typedef {'closed'|'custom_hours'|'blocked'} AvailabilityExceptionType
 * @typedef {'appointment'|'request'} BookingMode
 */

/**
 * @typedef {Object} DomainBooking
 * @property {string} id
 * @property {string} resourceId
 * @property {string|null} serviceId
 * @property {string|null} customerActorId
 * @property {string|null} customerProfileId
 * @property {BookingStatus} status
 * @property {BookingSource} source
 * @property {string} startsAt
 * @property {string} endsAt
 * @property {string} timezone
 * @property {string} serviceLabelSnapshot
 * @property {number} durationMinutes
 * @property {string|null} customerName
 * @property {string|null} customerPhone
 * @property {string|null} customerEmail
 * @property {string|null} customerNote
 * @property {string|null} internalNote
 * @property {string|null} cancelledAt
 * @property {string|null} completedAt
 * @property {string|null} createdByActorId
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 */

/**
 * @typedef {Object} DomainBookingResource
 * @property {string} id
 * @property {string} ownerActorId
 * @property {ResourceType} resourceType
 * @property {string} name
 * @property {boolean} isActive
 * @property {string} timezone
 * @property {number} sortOrder
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 */

/**
 * @typedef {Object} DomainAvailabilityRule
 * @property {string} id
 * @property {string} resourceId
 * @property {AvailabilityRuleType} ruleType
 * @property {number} weekday   0=Sun … 6=Sat
 * @property {string} startTime  HH:MM
 * @property {string} endTime    HH:MM
 * @property {string|null} validFrom
 * @property {string|null} validUntil
 * @property {boolean} isActive
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 */

/**
 * @typedef {Object} DomainAvailabilityException
 * @property {string} id
 * @property {string} resourceId
 * @property {AvailabilityExceptionType} exceptionType
 * @property {string} startsAt
 * @property {string} endsAt
 * @property {string|null} note
 * @property {string|null} createdByActorId
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 */

/**
 * @typedef {Object} DomainBookingServiceProfile
 * @property {string} serviceId
 * @property {number} durationMinutes
 * @property {number} paddingBeforeMinutes
 * @property {number} paddingAfterMinutes
 * @property {BookingMode} bookingMode
 * @property {number} maxConcurrent
 * @property {boolean} isBookable
 * @property {number|null} priceCents
 * @property {string} currencyCode
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 */
