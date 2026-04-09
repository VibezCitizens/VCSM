// ============================================================
// Portfolio Engine — Delete Portfolio Item Controller
// ============================================================

import { isActorOwner } from '../config.js'
import { dalGetPortfolioItemById } from '../dal/portfolioItems.read.dal.js'
import { dalSoftDeletePortfolioItem } from '../dal/portfolioItems.write.dal.js'
import { PortfolioItemModel } from '../model/PortfolioItem.model.js'
import { emit, EVENTS } from '../events.js'

/**
 * Soft-delete a portfolio item. Only the owner can delete.
 *
 * @param {Object} params
 * @param {string} params.itemId
 * @param {string} params.actorId
 * @returns {Promise<import('../types/index.js').DomainPortfolioItem>}
 */
export async function deleteItem({ itemId, actorId }) {
  if (!itemId || !actorId) {
    throw new Error('[deleteItem] itemId and actorId are required')
  }

  const existing = await dalGetPortfolioItemById({ itemId })
  if (!existing) {
    throw new Error('[deleteItem] portfolio item not found')
  }

  if (existing.actor_id !== actorId) {
    throw new Error('[deleteItem] not authorized to delete this item')
  }

  const ownerCheck = await isActorOwner(actorId)
  if (!ownerCheck) {
    throw new Error('[deleteItem] not authorized as this actor')
  }

  if (existing.is_deleted) {
    return PortfolioItemModel(existing)
  }

  const row = await dalSoftDeletePortfolioItem({ itemId })

  emit(EVENTS.ITEM_DELETED, { itemId, actorId })

  return PortfolioItemModel(row)
}
