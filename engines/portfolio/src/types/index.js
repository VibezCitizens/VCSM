// ============================================================
// Portfolio Engine — Type Definitions (JSDoc)
// ============================================================

/**
 * @typedef {Object} DomainPortfolioItem
 * @property {string}      id
 * @property {string}      actorId
 * @property {string|null} serviceId
 * @property {string}      title
 * @property {string}      description
 * @property {string}      portfolioKind
 * @property {string}      visibility
 * @property {string|null} coverMediaId
 * @property {string|null} coverUrl
 * @property {boolean}     isFeatured
 * @property {boolean}     isPinned
 * @property {boolean}     isActive
 * @property {boolean}     isDeleted
 * @property {number}      sortOrder
 * @property {string|null} sourcePostId
 * @property {string|null} createdByActorId
 * @property {string|null} publishedAt
 * @property {string}      createdAt
 * @property {string}      updatedAt
 * @property {string|null} deletedAt
 * @property {number}      [mediaCount]
 * @property {DomainPortfolioMedia[]} [media]
 * @property {string[]}    [tags]
 */

/**
 * @typedef {Object} DomainPortfolioMedia
 * @property {string}      id
 * @property {string}      portfolioItemId
 * @property {string}      actorId
 * @property {string}      url
 * @property {string}      mediaType
 * @property {string}      mediaRole
 * @property {string}      altText
 * @property {number|null} width
 * @property {number|null} height
 * @property {number|null} durationSeconds
 * @property {number}      sortOrder
 * @property {boolean}     isActive
 * @property {string}      createdAt
 * @property {string}      updatedAt
 */

/**
 * @typedef {Object} DomainBarberDetails
 * @property {string}      portfolioItemId
 * @property {string|null} haircutStyle
 * @property {string|null} fadeType
 * @property {string|null} beardService
 * @property {string|null} hairLength
 * @property {string|null} clientAgeGroup
 * @property {boolean}     hasDesign
 * @property {boolean}     hasColor
 * @property {boolean}     hasBeard
 * @property {string}      notes
 */

/**
 * @typedef {Object} DomainPortfolioListResult
 * @property {DomainPortfolioItem[]} items
 * @property {boolean} hasMore
 */

export {}
