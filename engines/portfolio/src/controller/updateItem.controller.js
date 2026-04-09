// ============================================================
// Portfolio Engine — Update Portfolio Item Controller
// ============================================================

import { isActorOwner } from '../config.js'
import { dalGetPortfolioItemById } from '../dal/portfolioItems.read.dal.js'
import { dalUpdatePortfolioItem } from '../dal/portfolioItems.write.dal.js'
import { dalReplacePortfolioTags } from '../dal/portfolioTags.write.dal.js'
import { PortfolioItemModel } from '../model/PortfolioItem.model.js'
import { emit, EVENTS } from '../events.js'

/**
 * Update a portfolio item. Only the owner can update.
 *
 * @param {Object} params
 * @param {string} params.itemId
 * @param {string} params.actorId
 * @param {Object} [params.updates]
 * @param {string[]} [params.tags]
 * @returns {Promise<import('../types/index.js').DomainPortfolioItem>}
 */
export async function updateItem({ itemId, actorId, updates, tags }) {
  if (!itemId || !actorId) {
    throw new Error('[updateItem] itemId and actorId are required')
  }

  const existing = await dalGetPortfolioItemById({ itemId })
  if (!existing) {
    throw new Error('[updateItem] portfolio item not found')
  }

  if (existing.actor_id !== actorId) {
    throw new Error('[updateItem] not authorized to update this item')
  }

  const ownerCheck = await isActorOwner(actorId)
  if (!ownerCheck) {
    throw new Error('[updateItem] not authorized as this actor')
  }

  const row = await dalUpdatePortfolioItem({ itemId, updates: updates ?? {} })

  if (tags !== undefined) {
    await dalReplacePortfolioTags({ itemId, tags })
  }

  emit(EVENTS.ITEM_UPDATED, { itemId, actorId })

  return PortfolioItemModel(row)
}
