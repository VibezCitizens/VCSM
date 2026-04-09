// ============================================================
// Reviews Engine — Dimension Rating Model
// ============================================================

/**
 * @param {Object} raw - review_dimension_ratings row
 * @returns {import('../types/index.js').DomainDimensionRating}
 */
export function DimensionRatingModel(raw) {
  if (!raw) return null
  return {
    reviewId:       raw.review_id,
    dimensionId:    raw.dimension_id,
    dimensionKey:   raw.review_dimensions?.key ?? raw.dimension_key ?? null,
    rating:         raw.rating,
    labelSnapshot:  raw.label_snapshot ?? null,
    weightSnapshot: parseFloat(raw.weight_snapshot) || 1.0,
  }
}
