// ============================================================
// Portfolio Engine — Portfolio Service
// ============================================================

import { dalGetPortfolioItemById } from '../dal/portfolioItems.read.dal.js'
import { PortfolioItemModel } from '../model/PortfolioItem.model.js'

/**
 * Check if a portfolio item exists and is active.
 */
export async function itemExists(itemId) {
  const row = await dalGetPortfolioItemById({ itemId })
  return !!(row && !row.is_deleted && row.is_active)
}

/**
 * Resolve a portfolio item as a domain object.
 */
export async function resolveItem(itemId) {
  const row = await dalGetPortfolioItemById({ itemId })
  return PortfolioItemModel(row)
}
