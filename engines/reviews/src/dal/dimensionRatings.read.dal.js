// ============================================================
// Reviews Engine — Dimension Ratings Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const RATING_COLUMNS = `
  review_id, dimension_id, rating, label_snapshot, weight_snapshot, created_at, updated_at,
  review_dimensions ( key )
`

/**
 * Fetch all dimension ratings for a list of review IDs.
 *
 * @param {Object} params
 * @param {string[]} params.reviewIds
 * @param {Object} [params.trace]
 * @returns {Promise<Object[]>}
 */
export async function dalListDimensionRatingsByReviewIds({ reviewIds, trace = null }) {
  if (!reviewIds?.length) return []

  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'DIMENSION_RATINGS_LIST_START',
    status: 'start',
    dalName: 'dalListDimensionRatingsByReviewIds',
    reviewIdCount: reviewIds.length,
  })

  const { data, error } = await supabase
    .schema('reviews')
    .from('review_dimension_ratings')
    .select(RATING_COLUMNS)
    .in('review_id', reviewIds)

  if (error) {
    trace?.report?.({ step: 'DIMENSION_RATINGS_LIST_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({
    step: 'DIMENSION_RATINGS_LIST_SUCCESS',
    status: 'success',
    rowCount: data?.length ?? 0,
  })

  return data ?? []
}

/**
 * Fetch dimension ratings for a single review.
 *
 * @param {Object} params
 * @param {string} params.reviewId
 * @param {Object} [params.trace]
 * @returns {Promise<Object[]>}
 */
export async function dalListDimensionRatingsForReview({ reviewId, trace = null }) {
  return dalListDimensionRatingsByReviewIds({ reviewIds: [reviewId], trace })
}
