// ============================================================
// Reviews Engine — Reviews Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

const REVIEW_COLUMNS = `
  id, target_actor_id, author_actor_id, target_kind, target_subtype,
  review_mode, verification_status, transaction_ref, transaction_occurred_at,
  rating_scale, overall_rating, body, active_card,
  author_display_name_snapshot, author_username_snapshot, author_avatar_url_snapshot,
  target_display_name_snapshot, target_username_snapshot, target_avatar_url_snapshot,
  created_at, updated_at, review_activity_at, is_deleted, deleted_at
`

/**
 * List reviews for a target actor with cursor-based pagination.
 *
 * @param {Object} params
 * @param {string} params.targetActorId
 * @param {string} [params.cursor] - ISO timestamp cursor (review_activity_at)
 * @param {number} [params.limit=20]
 * @param {Object} [params.trace]
 * @returns {Promise<Object[]>}
 */
export async function dalListReviewsByTarget({ targetActorId, cursor = null, limit = 20, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'REVIEWS_LIST_START',
    status: 'start',
    dalName: 'dalListReviewsByTarget',
  })

  let query = supabase
    .schema('reviews')
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .eq('target_actor_id', targetActorId)
    .eq('active_card', true)
    .eq('is_deleted', false)
    .order('review_activity_at', { ascending: false })
    .limit(limit)

  if (cursor) {
    query = query.lt('review_activity_at', cursor)
  }

  const { data, error } = await query

  if (error) {
    trace?.report?.({ step: 'REVIEWS_LIST_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({
    step: 'REVIEWS_LIST_SUCCESS',
    status: 'success',
    rowCount: data?.length ?? 0,
  })

  return data ?? []
}

/**
 * Get the active review by a specific author for a target.
 *
 * @param {Object} params
 * @param {string} params.targetActorId
 * @param {string} params.authorActorId
 * @param {Object} [params.trace]
 * @returns {Promise<Object|null>}
 */
export async function dalGetActiveReviewByAuthor({ targetActorId, authorActorId, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'REVIEW_ACTIVE_BY_AUTHOR_START',
    status: 'start',
    dalName: 'dalGetActiveReviewByAuthor',
  })

  const { data, error } = await supabase
    .schema('reviews')
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .eq('target_actor_id', targetActorId)
    .eq('author_actor_id', authorActorId)
    .eq('review_mode', 'neutral')
    .eq('active_card', true)
    .eq('is_deleted', false)
    .limit(1)

  if (error) {
    trace?.report?.({ step: 'REVIEW_ACTIVE_BY_AUTHOR_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({
    step: 'REVIEW_ACTIVE_BY_AUTHOR_SUCCESS',
    status: 'success',
    found: !!(data?.[0]),
  })

  return data?.[0] ?? null
}

/**
 * Fetch a single review by ID.
 *
 * @param {Object} params
 * @param {string} params.reviewId
 * @param {Object} [params.trace]
 * @returns {Promise<Object|null>}
 */
export async function dalGetReviewById({ reviewId, trace = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('reviews')
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .eq('id', reviewId)
    .limit(1)

  if (error) {
    trace?.report?.({ step: 'REVIEW_BY_ID_ERROR', status: 'error', error })
    throw error
  }

  return data?.[0] ?? null
}
