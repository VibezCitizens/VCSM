// ============================================================
// Reviews Engine — Get Review Form Config Controller
// ============================================================

import { dalListActiveDimensions } from '../dal/dimensions.read.dal.js'
import { DimensionModel } from '../model/Dimension.model.js'

/**
 * Get the active review dimensions for a target kind/subtype.
 * Used to render the review form with the correct dimension fields.
 *
 * @param {Object} params
 * @param {string} [params.targetKind='vport']
 * @param {string} params.targetSubtype
 * @returns {Promise<import('../types/index.js').DomainReviewDimension[]>}
 */
export async function getReviewFormConfig({ targetKind = 'vport', targetSubtype }) {
  if (!targetSubtype) {
    throw new Error('[getReviewFormConfig] targetSubtype is required')
  }

  const rows = await dalListActiveDimensions({ targetKind, targetSubtype })

  return rows.map(DimensionModel).filter(Boolean)
}
