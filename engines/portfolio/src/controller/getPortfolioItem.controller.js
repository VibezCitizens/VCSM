// ============================================================
// Portfolio Engine — Get Portfolio Item Controller
// ============================================================

import { dalGetPortfolioItemById } from '../dal/portfolioItems.read.dal.js'
import { dalListMediaByItemId } from '../dal/portfolioMedia.read.dal.js'
import { dalListTagsByItemId } from '../dal/portfolioTags.read.dal.js'
import { dalGetBarberDetailsByItemId } from '../dal/barberDetails.read.dal.js'
import { dalGetLocksmithDetailsByItemId } from '../dal/locksmithDetails.read.dal.js'
import { PortfolioItemModel } from '../model/PortfolioItem.model.js'
import { PortfolioMediaModel } from '../model/PortfolioMedia.model.js'
import { BarberDetailsModel } from '../model/BarberDetails.model.js'
import { LocksmithDetailsModel } from '../model/LocksmithDetails.model.js'

/**
 * Get a single portfolio item with full detail (media, tags, type-specific details).
 *
 * @param {Object} params
 * @param {string} params.itemId
 * @param {boolean} [params.includeBarberDetails=false]
 * @param {boolean} [params.includeLocksmithDetails=false]
 * @returns {Promise<Object|null>}
 */
export async function getPortfolioItem({ itemId, includeBarberDetails = false, includeLocksmithDetails = false }) {
  if (!itemId) {
    throw new Error('[getPortfolioItem] itemId is required')
  }

  const row = await dalGetPortfolioItemById({ itemId })
  if (!row) return null

  const [mediaRows, tagRows, barberRow, locksmithRow] = await Promise.all([
    dalListMediaByItemId({ itemId }),
    dalListTagsByItemId({ itemId }),
    includeBarberDetails ? dalGetBarberDetailsByItemId({ itemId }) : null,
    includeLocksmithDetails ? dalGetLocksmithDetailsByItemId({ itemId }) : null,
  ])

  const item = PortfolioItemModel(row)

  return {
    ...item,
    media: mediaRows.map(PortfolioMediaModel).filter(Boolean),
    tags: tagRows.map((t) => t.tag),
    barberDetails: barberRow ? BarberDetailsModel(barberRow) : null,
    locksmithDetails: locksmithRow ? LocksmithDetailsModel(locksmithRow) : null,
  }
}
