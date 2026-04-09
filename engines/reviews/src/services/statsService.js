// ============================================================
// Reviews Engine — Stats Service
// ============================================================

import { dalRpcGetTargetOverallStats } from '../dal/reviews.rpc.dal.js'
import { TargetStatsModel } from '../model/TargetStats.model.js'

/**
 * Fetch and model official stats for a target actor.
 *
 * @param {string} targetActorId
 * @returns {Promise<import('../types/index.js').DomainTargetStats|null>}
 */
export async function resolveTargetStats(targetActorId) {
  const row = await dalRpcGetTargetOverallStats({ targetActorId })
  return TargetStatsModel(row)
}
