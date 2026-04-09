// ============================================================
// Reviews Engine — Dimension Service
// ============================================================

import { dalListActiveDimensions } from '../dal/dimensions.read.dal.js'
import { DimensionModel } from '../model/Dimension.model.js'

/**
 * Resolve active dimensions for a target kind/subtype.
 * Returns domain objects sorted by sort_order.
 *
 * @param {string} targetKind
 * @param {string} targetSubtype
 * @returns {Promise<import('../types/index.js').DomainReviewDimension[]>}
 */
export async function resolveActiveDimensions(targetKind, targetSubtype) {
  const rows = await dalListActiveDimensions({ targetKind, targetSubtype })
  return rows.map(DimensionModel).filter(Boolean)
}

/**
 * Validate that a set of dimension IDs are valid and active for a target.
 *
 * @param {string[]} dimensionIds
 * @param {string} targetKind
 * @param {string} targetSubtype
 * @returns {Promise<{valid: boolean, activeDimensionIds: Set<string>}>}
 */
export async function validateDimensionIds(dimensionIds, targetKind, targetSubtype) {
  const dimensions = await resolveActiveDimensions(targetKind, targetSubtype)
  const activeDimensionIds = new Set(dimensions.map((d) => d.id))

  const allValid = dimensionIds.every((id) => activeDimensionIds.has(id))

  return { valid: allValid, activeDimensionIds }
}
