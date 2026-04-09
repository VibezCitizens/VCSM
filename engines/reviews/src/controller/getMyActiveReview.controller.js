// ============================================================
// Reviews Engine — Get My Active Review Controller
// ============================================================

import { dalGetActiveReviewByAuthor } from '../dal/reviews.read.dal.js'
import { dalListDimensionRatingsForReview } from '../dal/dimensionRatings.read.dal.js'
import { ReviewModel } from '../model/Review.model.js'
import { DimensionRatingModel } from '../model/DimensionRating.model.js'

/**
 * Get the current user's active neutral review for a target.
 * Returns null if no active review exists.
 *
 * @param {Object} params
 * @param {string} params.targetActorId
 * @param {string} params.authorActorId
 * @returns {Promise<{review: import('../types/index.js').DomainReview, ratings: import('../types/index.js').DomainDimensionRating[]}|null>}
 */
export async function getMyActiveReview({ targetActorId, authorActorId }) {
  if (!targetActorId || !authorActorId) {
    throw new Error('[getMyActiveReview] targetActorId and authorActorId are required')
  }

  const row = await dalGetActiveReviewByAuthor({ targetActorId, authorActorId })
  if (!row) return null

  const review = ReviewModel(row)

  const ratingRows = await dalListDimensionRatingsForReview({ reviewId: row.id })
  const ratings = ratingRows.map(DimensionRatingModel).filter(Boolean)

  return {
    review: { ...review, ratings },
    ratings,
  }
}
