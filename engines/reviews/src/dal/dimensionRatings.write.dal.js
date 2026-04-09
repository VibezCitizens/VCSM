// ============================================================
// Reviews Engine — Dimension Ratings Write DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Upsert dimension ratings for a review.
 * Each rating is keyed by (review_id, dimension_id).
 *
 * @param {Object} params
 * @param {string} params.reviewId
 * @param {Array<{dimensionId: string, rating: number}>} params.ratings
 * @param {Object} [params.trace]
 * @returns {Promise<Object[]>}
 */
export async function dalUpsertDimensionRatings({ reviewId, ratings, trace = null }) {
  if (!ratings?.length) return []

  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'DIMENSION_RATINGS_UPSERT_START',
    status: 'start',
    dalName: 'dalUpsertDimensionRatings',
    ratingCount: ratings.length,
  })

  const rows = ratings.map((r) => ({
    review_id: reviewId,
    dimension_id: r.dimensionId,
    rating: r.rating,
  }))

  const { data, error } = await supabase
    .schema('reviews')
    .from('review_dimension_ratings')
    .upsert(rows, { onConflict: 'review_id,dimension_id' })
    .select('review_id, dimension_id, rating, label_snapshot, weight_snapshot')

  if (error) {
    trace?.report?.({ step: 'DIMENSION_RATINGS_UPSERT_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({
    step: 'DIMENSION_RATINGS_UPSERT_SUCCESS',
    status: 'success',
    rowCount: data?.length ?? 0,
  })

  return data ?? []
}

/**
 * Delete all dimension ratings for a review.
 *
 * @param {Object} params
 * @param {string} params.reviewId
 * @param {Object} [params.trace]
 * @returns {Promise<void>}
 */
export async function dalDeleteDimensionRatingsForReview({ reviewId, trace = null }) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('reviews')
    .from('review_dimension_ratings')
    .delete()
    .eq('review_id', reviewId)

  if (error) {
    trace?.report?.({ step: 'DIMENSION_RATINGS_DELETE_ERROR', status: 'error', error })
    throw error
  }
}
