// ============================================================
// Reviews Engine — List Reviews Controller
// ============================================================

import { dalListReviewsByTarget } from '../dal/reviews.read.dal.js'
import { dalListDimensionRatingsByReviewIds } from '../dal/dimensionRatings.read.dal.js'
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

  // Ratings live in a separate table — one batch fetch for all reviews.
  const ratingRows = await dalListDimensionRatingsByReviewIds({ reviewIds })

  const ratingsMap = new Map()
  for (const r of ratingRows) {
    if (!ratingsMap.has(r.review_id)) ratingsMap.set(r.review_id, [])
    ratingsMap.get(r.review_id).push(DimensionRatingModel(r))
  }

  // Author cards are built from snapshot columns already present in every review row.
  // The reviews.reviews table captures author display data at write time via
  // upsert_neutral_review (SECURITY DEFINER). No secondary RPC calls needed.
  // This eliminates the previous N+1 pattern (one RPC per review).
  const reviews = rows.map((row) => {
    const review = ReviewModel(row)
    return {
      ...review,
      ratings: ratingsMap.get(row.id) ?? [],
      authorCard: AuthorCardModel({
        actor_id:     row.author_actor_id,
        display_name: row.author_display_name_snapshot,
        username:     row.author_username_snapshot,
        avatar_url:   row.author_avatar_url_snapshot,
      }),
    }
  })

  const nextCursor = rows.length >= limit
    ? rows[rows.length - 1].review_activity_at
    : null

  return { reviews, nextCursor }
}
