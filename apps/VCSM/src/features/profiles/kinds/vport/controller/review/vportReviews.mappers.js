export function assertActorId(id, label) {
  if (!id || typeof id !== 'string') {
    throw new Error(`[VportReviews] missing ${label}`)
  }
}

/**
 * Map engine DomainReviewDimension → legacy hook shape.
 * Hook expects: { vportType, dimensionKey, label, weight, sortOrder }
 */
export function mapDimension(d) {
  if (!d) return null
  return {
    vportType: d.targetSubtype ?? null,
    dimensionKey: d.key,
    label: d.label,
    weight: d.weight ?? 1,
    sortOrder: d.sortOrder ?? 0,
  }
}

/**
 * Map engine DomainTargetStats → legacy hook shape.
 * Hook uses: officialStats?.overallAverage, officialStats?.totalReviews
 */
export function mapStats(s) {
  if (!s) return null
  return {
    targetActorId: s.targetActorId,
    totalReviews: s.reviewCount ?? 0,
    verifiedReviewCount: s.reviewCount ?? 0,
    neutralReviewCount: s.neutralReviewCount ?? 0,
    transactionalReviewCount: s.transactionalReviewCount ?? 0,
    overallAverage: s.overallAvg ?? null,
    officialOverallAvg: s.overallAvg ?? null,
    officialOverallP50: s.overallP50 ?? null,
    officialOverallP90: s.overallP90 ?? null,
  }
}

/**
 * Map engine DomainDimensionRating → legacy hook shape.
 * Hook expects: { reviewId, dimensionKey, rating }
 */
export function mapRating(r) {
  if (!r) return null
  return {
    reviewId: r.reviewId,
    dimensionKey: r.dimensionKey ?? null,
    dimensionId: r.dimensionId,
    rating: r.rating,
    labelSnapshot: r.labelSnapshot ?? null,
    weightSnapshot: r.weightSnapshot ?? 1,
  }
}

/**
 * Map engine review + authorCard → legacy hook shape.
 * Hook expects flat author fields: authorDisplayName, authorUsername, authorAvatarUrl
 */
export function mapReview(review) {
  if (!review) return null

  const authorCard = review.authorCard ?? null

  return {
    id: review.id,
    targetActorId: review.targetActorId,
    authorActorId: review.authorActorId,
    vportType: review.targetSubtype ?? null,
    isVerified: review.verificationStatus === 'verified',
    ratingScale: review.ratingScale ?? 5,
    overallRating: review.overallRating ?? null,
    body: review.body ?? null,
    createdAt: review.createdAt ?? null,
    updatedAt: review.updatedAt ?? null,
    reviewActivityAt: review.reviewActivityAt ?? null,
    isDeleted: review.isDeleted ?? false,
    deletedAt: review.deletedAt ?? null,
    ratings: (review.ratings ?? []).map(mapRating).filter(Boolean),
    authorDisplayName: authorCard?.displayName ?? review.authorDisplayNameSnapshot ?? 'Anonymous',
    authorUsername: authorCard?.username ?? review.authorUsernameSnapshot ?? '',
    authorAvatarUrl: authorCard?.avatarUrl ?? review.authorAvatarUrlSnapshot ?? '',
  }
}
