// ============================================================
// Reviews Engine — Type Definitions (JSDoc)
// ============================================================

/**
 * @typedef {Object} DomainReviewDimension
 * @property {string}  id
 * @property {string}  targetKind
 * @property {string}  targetSubtype
 * @property {string}  key
 * @property {string}  label
 * @property {number}  weight
 * @property {number}  sortOrder
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} DomainReview
 * @property {string}      id
 * @property {string}      targetActorId
 * @property {string}      authorActorId
 * @property {string}      targetKind
 * @property {string|null} targetSubtype
 * @property {string}      reviewMode
 * @property {string}      verificationStatus
 * @property {string|null} transactionRef
 * @property {string|null} transactionOccurredAt
 * @property {number}      ratingScale
 * @property {number|null} overallRating
 * @property {string}      body
 * @property {boolean}     activeCard
 * @property {string|null} authorDisplayNameSnapshot
 * @property {string|null} authorUsernameSnapshot
 * @property {string|null} authorAvatarUrlSnapshot
 * @property {string|null} targetDisplayNameSnapshot
 * @property {string|null} targetUsernameSnapshot
 * @property {string|null} targetAvatarUrlSnapshot
 * @property {string}      createdAt
 * @property {string}      updatedAt
 * @property {string}      reviewActivityAt
 * @property {boolean}     isDeleted
 * @property {string|null} deletedAt
 * @property {DomainDimensionRating[]} [ratings]
 */

/**
 * @typedef {Object} DomainDimensionRating
 * @property {string}      reviewId
 * @property {string}      dimensionId
 * @property {string|null} dimensionKey
 * @property {number}      rating
 * @property {string|null} labelSnapshot
 * @property {number}      weightSnapshot
 */

/**
 * @typedef {Object} DomainReviewRevision
 * @property {string}      id
 * @property {string}      reviewId
 * @property {number}      revisionNo
 * @property {string}      changeKind
 * @property {string}      body
 * @property {number|null} overallRating
 * @property {string}      reviewActivityAt
 * @property {Object}      snapshotJson
 * @property {string}      createdAt
 */

/**
 * @typedef {Object} DomainAuthorCard
 * @property {string}      actorId
 * @property {string}      displayName
 * @property {string|null} username
 * @property {string|null} avatarUrl
 */

/**
 * @typedef {Object} DomainTargetStats
 * @property {string}      targetActorId
 * @property {number}      reviewCount
 * @property {number}      neutralReviewCount
 * @property {number}      transactionalReviewCount
 * @property {number|null} overallAvg
 * @property {number|null} overallP50
 * @property {number|null} overallP90
 */

export {}
