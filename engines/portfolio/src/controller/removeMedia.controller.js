// ============================================================
// Portfolio Engine — Remove Media Controller
// ============================================================

import { isActorOwner } from '../config.js'
import { dalGetPortfolioMediaById } from '../dal/portfolioMedia.read.dal.js'
import { dalDeletePortfolioMedia } from '../dal/portfolioMedia.write.dal.js'
import { dalGetProfileIdByActorId } from '../dal/portfolioItems.read.dal.js'
import { emit, EVENTS } from '../events.js'

/**
 * Remove a media file from a portfolio item.
 *
 * PORT-V-003: ownership is now verified via profile_id cross-check before
 * deleting. Fetches the media row and the caller's profileId in parallel,
 * then confirms they match. isActorOwner is kept as a defense-in-depth
 * second gate to confirm the actor is non-void and session-bound.
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

  // Fetch media row and caller's profileId in parallel.
  const [media, callerProfileId] = await Promise.all([
    dalGetPortfolioMediaById({ mediaId }),
    dalGetProfileIdByActorId({ actorId }),
  ])

  if (!media) {
    throw new Error('[removeMedia] media not found')
  }

  if (media.profile_id !== callerProfileId) {
    throw new Error('[removeMedia] not authorized to remove this media')
  }

  const ownerCheck = await isActorOwner(actorId)
  if (!ownerCheck) {
    throw new Error('[removeMedia] not authorized as this actor')
  }

  await dalDeletePortfolioMedia({ mediaId })

  emit(EVENTS.MEDIA_REMOVED, { mediaId, actorId })
}
