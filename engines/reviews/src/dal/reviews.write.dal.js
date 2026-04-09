// ============================================================
// Reviews Engine — Reviews Write DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const REVIEW_RETURN_COLUMNS = `
  id, target_actor_id, author_actor_id, target_kind, target_subtype,
  review_mode, verification_status, rating_scale, overall_rating, body,
  active_card, author_display_name_snapshot, author_username_snapshot,
  author_avatar_url_snapshot, target_display_name_snapshot,
  target_username_snapshot, target_avatar_url_snapshot,
  created_at, updated_at, review_activity_at, is_deleted, deleted_at
`

/**
 * Insert a new review row.
 *
 * @param {Object} params
 * @param {string} params.targetActorId
 * @param {string} params.authorActorId
 * @param {string} params.body
 * @param {Object} [params.trace]
 * @returns {Promise<Object>}
 */
export async function dalInsertReview({ targetActorId, authorActorId, body, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'REVIEW_INSERT_START',
    status: 'start',
    dalName: 'dalInsertReview',
  })

  const { data, error } = await supabase
    .schema('reviews')
    .from('reviews')
    .insert([{
      target_actor_id: targetActorId,
      author_actor_id: authorActorId,
      review_mode: 'neutral',
      verification_status: 'unverified',
      body: body ?? '',
    }])
    .select(REVIEW_RETURN_COLUMNS)

  if (error) {
    trace?.report?.({ step: 'REVIEW_INSERT_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({ step: 'REVIEW_INSERT_SUCCESS', status: 'success' })
  return data?.[0] ?? null
}

/**
 * Update review body for an existing review.
 *
 * @param {Object} params
 * @param {string} params.reviewId
 * @param {string} params.body
 * @param {Object} [params.trace]
 * @returns {Promise<Object>}
 */
export async function dalUpdateReviewBody({ reviewId, body, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'REVIEW_UPDATE_BODY_START',
    status: 'start',
    dalName: 'dalUpdateReviewBody',
  })

  const { data, error } = await supabase
    .schema('reviews')
    .from('reviews')
    .update({
      body: body ?? '',
      review_activity_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select(REVIEW_RETURN_COLUMNS)

  if (error) {
    trace?.report?.({ step: 'REVIEW_UPDATE_BODY_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({ step: 'REVIEW_UPDATE_BODY_SUCCESS', status: 'success' })
  return data?.[0] ?? null
}

/**
 * Soft-delete a review.
 *
 * @param {Object} params
 * @param {string} params.reviewId
 * @param {Object} [params.trace]
 * @returns {Promise<Object>}
 */
export async function dalSoftDeleteReview({ reviewId, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'REVIEW_SOFT_DELETE_START',
    status: 'start',
    dalName: 'dalSoftDeleteReview',
  })

  const { data, error } = await supabase
    .schema('reviews')
    .from('reviews')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select(REVIEW_RETURN_COLUMNS)

  if (error) {
    trace?.report?.({ step: 'REVIEW_SOFT_DELETE_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({ step: 'REVIEW_SOFT_DELETE_SUCCESS', status: 'success' })
  return data?.[0] ?? null
}
