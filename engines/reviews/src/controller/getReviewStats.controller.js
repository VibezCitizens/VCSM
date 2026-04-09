// ============================================================
// Reviews Engine — Get Review Stats Controller
// ============================================================

import { dalRpcGetTargetOverallStats } from '../dal/reviews.rpc.dal.js'
import { TargetStatsModel } from '../model/TargetStats.model.js'
import { emit, EVENTS } from '../events.js'

/**
 * Get official aggregate stats for a target actor.
 * Uses DB RPC for authoritative calculation.
 *
 * @param {Object} params
 * @param {string} params.targetActorId
 * @returns {Promise<import('../types/index.js').DomainTargetStats|null>}
 */
export async function getTargetStats({ targetActorId }) {
  if (!targetActorId) {
    throw new Error('[getTargetStats] targetActorId is required')
  }

  const row = await dalRpcGetTargetOverallStats({ targetActorId })

  emit(EVENTS.STATS_REQUESTED, { targetActorId })

  return TargetStatsModel(row)
}
