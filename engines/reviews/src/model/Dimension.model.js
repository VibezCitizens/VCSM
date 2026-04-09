// ============================================================
// Reviews Engine — Dimension Model
// ============================================================

/**
 * @param {Object} raw - review_dimensions row
 * @returns {import('../types/index.js').DomainReviewDimension}
 */
export function DimensionModel(raw) {
  if (!raw) return null
  return {
    id:            raw.id,
    targetKind:    raw.target_kind ?? 'vport',
    targetSubtype: raw.target_subtype ?? null,
    key:           raw.key,
    label:         raw.label,
    weight:        parseFloat(raw.weight) || 1.0,
    sortOrder:     raw.sort_order ?? 0,
    isActive:      raw.is_active ?? true,
  }
}
