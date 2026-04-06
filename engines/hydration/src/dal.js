// engines/hydration/src/dal.js
// ============================================================
// Actor Summaries DAL — single canonical data source
// ============================================================

import { getSupabaseClient } from './config.js'

/**
 * Fetch actor summaries by IDs via the canonical RPC.
 * This is the ONE data source all hydration flows should use.
 *
 * @param {Object} params
 * @param {string[]} params.actorIds
 * @returns {Promise<{ rows: Array, error: Error|null }>}
 */
export async function getActorSummariesByIdsDAL({ actorIds }) {
  if (!Array.isArray(actorIds) || actorIds.length === 0) {
    return { rows: [], error: null }
  }

  const uniqueActorIds = [...new Set(actorIds.filter(Boolean))]
  if (uniqueActorIds.length === 0) {
    return { rows: [], error: null }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.warn('[hydration/dal] supabase client not configured')
    return { rows: [], error: new Error('supabase client not configured') }
  }

  try {
    const { data, error } = await supabase
      .schema('vc')
      .rpc('get_actor_summaries', {
        p_actor_ids: uniqueActorIds,
      })

    if (error) {
      return { rows: [], error }
    }

    return {
      rows: Array.isArray(data) ? data : [],
      error: null,
    }
  } catch (err) {
    return { rows: [], error: err }
  }
}
