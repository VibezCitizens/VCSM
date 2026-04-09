// ============================================================
// Reviews Engine — Review Revision Model
// ============================================================

/**
 * @param {Object} raw - review_revisions row
 * @returns {import('../types/index.js').DomainReviewRevision}
 */
export function ReviewRevisionModel(raw) {
  if (!raw) return null
  return {
    id:               raw.id,
    reviewId:         raw.review_id,
    revisionNo:       raw.revision_no,
    changeKind:       raw.change_kind,
    body:             raw.body ?? '',
    overallRating:    raw.overall_rating != null ? parseFloat(raw.overall_rating) : null,
    reviewActivityAt: raw.review_activity_at,
    snapshotJson:     raw.snapshot_json ?? {},
    createdAt:        raw.created_at,
  }
}
