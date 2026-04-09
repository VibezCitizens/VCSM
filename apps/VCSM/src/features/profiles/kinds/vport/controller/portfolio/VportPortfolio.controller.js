// ============================================================
// VCSM — Vport Portfolio Controller (Engine-Backed)
// ============================================================

import {
  listPortfolio as engineListPortfolio,
  getPortfolioItem as engineGetPortfolioItem,
} from '@portfolio'

/**
 * List portfolio items for a vport actor.
 * @param {string} actorId
 * @param {{ limit?: number, offset?: number }} [opts]
 * @returns {Promise<{ items: Object[], hasMore: boolean }>}
 */
export async function ctrlListPortfolio(actorId, { limit = 24, offset = 0 } = {}) {
  if (!actorId) throw new Error('[VportPortfolio] actorId is required')

  return engineListPortfolio({ actorId, limit, offset })
}

/**
 * Get a single portfolio item with full detail.
 * @param {string} itemId
 * @param {{ includeBarberDetails?: boolean, includeLocksmithDetails?: boolean }} [opts]
 * @returns {Promise<Object|null>}
 */
export async function ctrlGetPortfolioItem(itemId, { includeBarberDetails = true, includeLocksmithDetails = true } = {}) {
  if (!itemId) throw new Error('[VportPortfolio] itemId is required')

  return engineGetPortfolioItem({ itemId, includeBarberDetails, includeLocksmithDetails })
}
