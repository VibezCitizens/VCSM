// ============================================================
// Portfolio Engine — Portfolio Items RPC DAL
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Fetch portfolio items for a vport actor via the public read RPC.
 * Returns items with cover URL and media count.
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {number} [params.limit=24]
 * @param {number} [params.offset=0]
 * @param {Object} [params.trace]
 * @returns {Promise<Object[]>}
 */
export async function dalRpcGetVportPortfolio({ actorId, limit = 24, offset = 0, trace = null }) {
  const supabase = getSupabaseClient()

  trace?.report?.({
    step: 'RPC_GET_PORTFOLIO_START',
    status: 'start',
    dalName: 'dalRpcGetVportPortfolio',
  })

  const { data, error } = await supabase.schema('vc').rpc('get_vport_portfolio', {
    p_actor_id: actorId,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) {
    trace?.report?.({ step: 'RPC_GET_PORTFOLIO_ERROR', status: 'error', error })
    throw error
  }

  trace?.report?.({
    step: 'RPC_GET_PORTFOLIO_SUCCESS',
    status: 'success',
    rowCount: data?.length ?? 0,
  })

  return data ?? []
}
