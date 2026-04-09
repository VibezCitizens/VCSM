// ============================================================
// Portfolio Engine — Remove Media Controller
// ============================================================

import { isActorOwner } from '../config.js'
import { dalDeletePortfolioMedia } from '../dal/portfolioMedia.write.dal.js'
import { emit, EVENTS } from '../events.js'

/**
 * Remove a media file from a portfolio item.
 *
 * @param {Object} params
 * @param {string} params.mediaId
 * @param {string} params.actorId
 * @returns {Promise<void>}
 */
export async function removeMedia({ mediaId, actorId }) {
  if (!mediaId || !actorId) {
    throw new Error('[removeMedia] mediaId and actorId are required')
  }

  const ownerCheck = await isActorOwner(actorId)
  if (!ownerCheck) {
    throw new Error('[removeMedia] not authorized as this actor')
  }

  await dalDeletePortfolioMedia({ mediaId })

  emit(EVENTS.MEDIA_REMOVED, { mediaId, actorId })
}
