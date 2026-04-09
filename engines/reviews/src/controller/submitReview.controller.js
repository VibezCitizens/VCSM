// ============================================================
// Reviews Engine — Submit Review Controller
// ============================================================

import { isActorOwner } from '../config.js'
import { dalRpcUpsertNeutralReview } from '../dal/reviews.rpc.dal.js'
import { dalGetReviewById } from '../dal/reviews.read.dal.js'
import { dalUpsertDimensionRatings } from '../dal/dimensionRatings.write.dal.js'
import { dalListDimensionRatingsForReview } from '../dal/dimensionRatings.read.dal.js'
import { ReviewModel } from '../model/Review.model.js'
import { DimensionRatingModel } from '../model/DimensionRating.model.js'
import { emit, EVENTS } from '../events.js'

/**
 * Submit or update a neutral review.
 * Uses the DB RPC for idempotent upsert (one active card per author→target).
 * Optionally upserts dimension ratings.
 *
 * @param {Object} params
 * @param {string} params.targetActorId
 * @param {string} params.authorActorId
 * @param {string} params.body
 * @param {Array<{dimensionId: string, rating: number}>} [params.ratings]
 * @returns {Promise<{review: import('../types/index.js').DomainReview, ratings: import('../types/index.js').DomainDimensionRating[]}>}
 */
export async function submitReview({ targetActorId, authorActorId, body, ratings = null }) {
  if (!targetActorId || !authorActorId) {
    throw new Error('[submitReview] targetActorId and authorActorId are required')
  }

  if (targetActorId === authorActorId) {
    throw new Error('[submitReview] cannot review yourself')
  }

  const ownerCheck = await isActorOwner(authorActorId)
  if (!ownerCheck) {
    throw new Error('[submitReview] not authorized to write review as this actor')
  }

  if (ratings?.length) {
    for (const r of ratings) {
      if (!r.dimensionId || r.rating == null) {
        throw new Error('[submitReview] each rating must have dimensionId and rating')
      }
      if (r.rating < 1 || r.rating > 5) {
        throw new Error('[submitReview] rating must be between 1 and 5')
      }
    }
  }

  const reviewId = await dalRpcUpsertNeutralReview({
    targetActorId,
    authorActorId,
    body: body ?? '',
  })

  if (!reviewId) {
    throw new Error('[submitReview] upsert returned no review ID')
  }

  let ratingRows = []
  if (ratings?.length) {
    ratingRows = await dalUpsertDimensionRatings({ reviewId, ratings })
    emit(EVENTS.RATINGS_UPSERTED, { reviewId, ratingCount: ratingRows.length })
  }

  const reviewRow = await dalGetReviewById({ reviewId })
  const review = ReviewModel(reviewRow)

  const finalRatingRows = ratingRows.length
    ? ratingRows
    : await dalListDimensionRatingsForReview({ reviewId })

  const domainRatings = finalRatingRows.map(DimensionRatingModel).filter(Boolean)

  emit(EVENTS.REVIEW_CREATED, {
    reviewId,
    targetActorId,
    authorActorId,
    overallRating: review?.overallRating,
  })

  return {
    review: review ? { ...review, ratings: domainRatings } : null,
    ratings: domainRatings,
  }
}
