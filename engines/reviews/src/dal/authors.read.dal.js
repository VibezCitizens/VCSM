// ============================================================
// Reviews Engine — Author Cards Read DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Batch-fetch author cards for multiple reviews via RPC.
 * Uses SECURITY DEFINER to bypass RLS for private actors.
 *
 * @param {Object} params
 * @param {string[]} params.reviewIds
 * @param {Object} [params.trace]
 * @returns {Promise<Object[]>}
 */
export async function dalGetAuthorCardsForReviews({ reviewIds, trace = null }) {
  if (!reviewIds?.length) return []

  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'AUTHOR_CARDS_BATCH_START',
    status: 'start',
    dalName: 'dalGetAuthorCardsForReviews',
    reviewIdCount: reviewIds.length,
  })

  const results = []

  for (const reviewId of reviewIds) {
    const { data, error } = await supabase.schema('reviews').rpc('get_review_author_card', {
      p_review_id: reviewId,
    })

    if (error) {
      trace?.report?.({ step: 'AUTHOR_CARD_ERROR', status: 'error', reviewId, error })
      continue
    }

    if (data?.[0]) {
      results.push({ reviewId, ...data[0] })
    }
  }

  trace?.report?.({
    step: 'AUTHOR_CARDS_BATCH_SUCCESS',
    status: 'success',
    cardCount: results.length,
  })

  return results
}
