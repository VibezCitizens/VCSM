// ============================================================
// Reviews Engine — List Reviews Controller
// ============================================================

import { dalListReviewsByTarget } from '../dal/reviews.read.dal.js'
import { dalListDimensionRatingsByReviewIds } from '../dal/dimensionRatings.read.dal.js'
import { dalGetAuthorCardsForReviews } from '../dal/authors.read.dal.js'
import { ReviewModel } from '../model/Review.model.js'
import { DimensionRatingModel } from '../model/DimensionRating.model.js'
import { AuthorCardModel } from '../model/AuthorCard.model.js'

/**
 * List reviews for a target actor with pagination.
 * Enriches each review with dimension ratings and author card.
 *
 * @param {Object} params
 * @param {string} params.targetActorId
 * @param {string} [params.cursor]
 * @param {number} [params.limit=20]
 * @returns {Promise<{reviews: Object[], nextCursor: string|null}>}
 */
export async function listReviews({ targetActorId, cursor = null, limit = 20 }) {
  if (!targetActorId) {
    throw new Error('[listReviews] targetActorId is required')
  }

  const rows = await dalListReviewsByTarget({ targetActorId, cursor, limit })

  if (!rows.length) {
    return { reviews: [], nextCursor: null }
  }

  const reviewIds = rows.map((r) => r.id)

  const [ratingRows, authorCards] = await Promise.all([
    dalListDimensionRatingsByReviewIds({ reviewIds }),
    dalGetAuthorCardsForReviews({ reviewIds }),
  ])

  const ratingsMap = new Map()
  for (const r of ratingRows) {
    if (!ratingsMap.has(r.review_id)) ratingsMap.set(r.review_id, [])
    ratingsMap.get(r.review_id).push(DimensionRatingModel(r))
  }

  const authorsMap = new Map()
  for (const a of authorCards) {
    authorsMap.set(a.reviewId, AuthorCardModel(a))
  }

  const reviews = rows.map((row) => {
    const review = ReviewModel(row)
    return {
      ...review,
      ratings: ratingsMap.get(row.id) ?? [],
      authorCard: authorsMap.get(row.id) ?? null,
    }
  })

  const nextCursor = rows.length >= limit
    ? rows[rows.length - 1].review_activity_at
    : null

  return { reviews, nextCursor }
}
