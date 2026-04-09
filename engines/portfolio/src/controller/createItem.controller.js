// ============================================================
// Portfolio Engine — Create Portfolio Item Controller
// ============================================================

import { isActorOwner } from '../config.js'
import { dalInsertPortfolioItem } from '../dal/portfolioItems.write.dal.js'
import { dalInsertPortfolioTags } from '../dal/portfolioTags.write.dal.js'
import { PortfolioItemModel } from '../model/PortfolioItem.model.js'
import { emit, EVENTS } from '../events.js'

/**
 * Create a new portfolio item.
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {string} [params.title]
 * @param {string} [params.description]
 * @param {string} [params.portfolioKind]
 * @param {string} [params.serviceId]
 * @param {string} [params.visibility]
 * @param {string} [params.sourcePostId]
 * @param {string[]} [params.tags]
 * @returns {Promise<import('../types/index.js').DomainPortfolioItem>}
 */
export async function createItem({ actorId, title, description, portfolioKind, serviceId, visibility, sourcePostId, tags }) {
  if (!actorId) {
    throw new Error('[createItem] actorId is required')
  }

  const ownerCheck = await isActorOwner(actorId)
  if (!ownerCheck) {
    throw new Error('[createItem] not authorized as this actor')
  }

  const row = await dalInsertPortfolioItem({
    actorId,
    title,
    description,
    portfolioKind,
    serviceId,
    visibility,
    sourcePostId,
    createdByActorId: actorId,
  })

  if (!row) {
    throw new Error('[createItem] insert returned no row')
  }

  if (tags?.length) {
    await dalInsertPortfolioTags({ itemId: row.id, tags })
  }

  emit(EVENTS.ITEM_CREATED, { itemId: row.id, actorId })

  const item = PortfolioItemModel(row)
  return { ...item, tags: tags ?? [] }
}
