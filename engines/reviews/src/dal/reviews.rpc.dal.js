// ============================================================
// Reviews Engine — Reviews RPC DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Upsert a neutral review via the DB RPC function.
 * If an active neutral review exists for same author→target, updates it.
 * Otherwise inserts a new card.
 *
 * @param {Object} params
 * @param {string} params.targetActorId
 * @param {string} params.authorActorId
 * @param {string} params.body
 * @param {Object} [params.trace]
 * @returns {Promise<string>} review ID
 */
export async function dalRpcUpsertNeutralReview({ targetActorId, authorActorId, body, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'RPC_UPSERT_NEUTRAL_REVIEW_START',
    status: 'start',
    dalName: 'dalRpcUpsertNeutralReview',
  })

  const { data, error } = await supabase.schema('reviews').rpc('upsert_neutral_review', {
    p_target_actor_id: targetActorId,
    p_author_actor_id: authorActorId,
    p_body: body ?? '',
  })

  if (error) {
    trace?.report?.({ step: 'RPC_UPSERT_NEUTRAL_REVIEW_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({ step: 'RPC_UPSERT_NEUTRAL_REVIEW_SUCCESS', status: 'success' })
  return data
}

/**
 * Get author card for a review via DB RPC (SECURITY DEFINER).
 * Returns snapshot-first data so private actors still render.
 *
 * @param {Object} params
 * @param {string} params.reviewId
 * @param {Object} [params.trace]
 * @returns {Promise<Object|null>}
 */
export async function dalRpcGetReviewAuthorCard({ reviewId, trace = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.schema('reviews').rpc('get_review_author_card', {
    p_review_id: reviewId,
  })

  if (error) {
    trace?.report?.({ step: 'RPC_AUTHOR_CARD_ERROR', status: 'error', error })
    throw error
  }

  return data?.[0] ?? null
}

/**
 * Get official aggregate stats for a target actor via DB RPC.
 *
 * @param {Object} params
 * @param {string} params.targetActorId
 * @param {Object} [params.trace]
 * @returns {Promise<Object|null>}
 */
export async function dalRpcGetTargetOverallStats({ targetActorId, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'RPC_TARGET_STATS_START',
    status: 'start',
    dalName: 'dalRpcGetTargetOverallStats',
  })

  const { data, error } = await supabase.schema('reviews').rpc('get_target_overall_stats', {
    p_target_actor_id: targetActorId,
  })

  if (error) {
    trace?.report?.({ step: 'RPC_TARGET_STATS_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({ step: 'RPC_TARGET_STATS_SUCCESS', status: 'success' })
  return data?.[0] ?? null
}
