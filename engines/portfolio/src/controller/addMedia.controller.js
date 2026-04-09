// ============================================================
// Portfolio Engine — Add Media Controller
// ============================================================

import { isActorOwner } from '../config.js'
import { dalGetPortfolioItemById } from '../dal/portfolioItems.read.dal.js'
import { dalInsertPortfolioMedia } from '../dal/portfolioMedia.write.dal.js'
import { PortfolioMediaModel } from '../model/PortfolioMedia.model.js'
import { emit, EVENTS } from '../events.js'

/**
 * Add a media file to a portfolio item.
 *
 * @param {Object} params
 * @param {string} params.itemId
 * @param {string} params.actorId
 * @param {string} params.url
 * @param {string} [params.mediaType='image']
 * @param {string} [params.mediaRole='result']
 * @param {string} [params.altText]
 * @param {number} [params.width]
 * @param {number} [params.height]
 * @param {number} [params.durationSeconds]
 * @param {number} [params.sortOrder]
 * @returns {Promise<import('../types/index.js').DomainPortfolioMedia>}
 */
export async function addMedia({ itemId, actorId, url, mediaType, mediaRole, altText, width, height, durationSeconds, sortOrder }) {
  if (!itemId || !actorId || !url) {
    throw new Error('[addMedia] itemId, actorId, and url are required')
  }

  const item = await dalGetPortfolioItemById({ itemId })
  if (!item) {
    throw new Error('[addMedia] portfolio item not found')
  }

  if (item.actor_id !== actorId) {
    throw new Error('[addMedia] not authorized to add media to this item')
  }

  const ownerCheck = await isActorOwner(actorId)
  if (!ownerCheck) {
    throw new Error('[addMedia] not authorized as this actor')
  }

  const row = await dalInsertPortfolioMedia({
    portfolioItemId: itemId,
    actorId,
    url,
    mediaType,
    mediaRole,
    altText,
    width,
    height,
    durationSeconds,
    sortOrder,
  })

  emit(EVENTS.MEDIA_ADDED, { itemId, mediaId: row?.id, actorId })

  return PortfolioMediaModel(row)
}
