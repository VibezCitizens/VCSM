// ============================================================
// Reviews Engine — Target Stats Model
// ============================================================

/**
 * @param {Object} raw - get_target_overall_stats RPC result
 * @returns {import('../types/index.js').DomainTargetStats}
 */
export function TargetStatsModel(raw) {
  if (!raw) return null
  return {
    targetActorId:             raw.target_actor_id ?? raw.targetActorId ?? null,
    reviewCount:               parseInt(raw.review_count, 10) || 0,
    neutralReviewCount:        parseInt(raw.neutral_review_count, 10) || 0,
    transactionalReviewCount:  parseInt(raw.transactional_review_count, 10) || 0,
    overallAvg:                raw.overall_avg != null ? parseFloat(raw.overall_avg) : null,
    overallP50:                raw.overall_p50 != null ? parseFloat(raw.overall_p50) : null,
    overallP90:                raw.overall_p90 != null ? parseFloat(raw.overall_p90) : null,
  }
}
