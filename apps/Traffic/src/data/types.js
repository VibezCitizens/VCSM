/**
 * @typedef {Object} Country
 * @property {string} id
 * @property {string} code
 * @property {string} slug
 * @property {string} name
 * @property {string} defaultLocale
 * @property {string} defaultCurrencyCode
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Region
 * @property {string} id
 * @property {string} countryId
 * @property {string} code
 * @property {string} slug
 * @property {string} name
 * @property {"state"|"province"|"department"|"county"|"emirate"|"union_territory"} type
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} City
 * @property {string} id
 * @property {string} countryId
 * @property {string|null} regionId
 * @property {string} slug
 * @property {string} name
 * @property {string|null} stateCode
 * @property {string} countryCode
 * @property {string} timezone
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Locality
 * @property {string} id
 * @property {string} cityId
 * @property {string} slug
 * @property {string} name
 * @property {"neighborhood"|"district"|"borough"|"locality"|"zone"} localityType
 * @property {boolean} isActive
 */

/** @typedef {Locality} Neighborhood */

/**
 * @typedef {Object} Service
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string} category
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Specialty
 * @property {string} id
 * @property {string} serviceId
 * @property {string} slug
 * @property {string} name
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} Provider
 * @property {string} id
 * @property {string} slug
 * @property {string} displayName
 * @property {string} primaryCountryCode
 * @property {string|null} primaryRegionCode
 * @property {string} primaryCityId
 * @property {string|null} primaryLocalityId
 * @property {string|null} addressLine1
 * @property {string|null} postalCode
 * @property {string|null} phoneE164
 * @property {string} currencyCode
 * @property {"fixed_location"|"mobile"|"hybrid"} serviceAreaMode
 * @property {string|null} serviceAreaSummary
 * @property {string} shortBio
 * @property {boolean} isActive
 * @property {boolean} isIndexable
 * @property {"claimed"|"unclaimed"|"pending"} claimStatus
 * @property {string|null} vcsmActorId — VCSM actor UUID, set when provider is claimed and linked
 * @property {string|null} vcsmSlug — VCSM vport slug, used for deep linking to the real profile
 * @property {string|null} claimedAt — ISO 8601 timestamp of when the claim was approved
 */

/**
 * @typedef {Object} ProviderService
 * @property {string} id
 * @property {string} providerId
 * @property {string} serviceId
 * @property {string|null} specialtyId
 * @property {number|null} priceFromCents
 * @property {number|null} priceToCents
 * @property {string} currencyCode
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} ProviderStats
 * @property {string} providerId
 * @property {number} ratingAvg
 * @property {number} reviewCount
 * @property {number} bookingCount30d
 * @property {number} responseRate
 * @property {number} responseTimeP50Minutes
 * @property {number} rankScore
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} PriceAggregate
 * @property {string} id
 * @property {string} countryId
 * @property {string|null} regionId
 * @property {string} cityId
 * @property {string|null} neighborhoodId
 * @property {string} serviceId
 * @property {string|null} specialtyId
 * @property {number} sampleSize
 * @property {number|null} priceP25Cents
 * @property {number|null} priceP50Cents
 * @property {number|null} priceP75Cents
 * @property {string} currencyCode
 * @property {string} asOfDate
 */

/**
 * @typedef {Object} InternalLinkItem
 * @property {string} href
 * @property {string} label
 * @property {string} [description]
 */

/**
 * @typedef {Object} DirectoryProviderListItem
 * @property {Provider} provider
 * @property {ProviderStats|null} stats
 * @property {ProviderService[]} providerServices
 */
