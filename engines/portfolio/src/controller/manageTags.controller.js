// ============================================================
// Portfolio Engine — Manage Tags Controller
// ============================================================

import { isActorOwner } from '../config.js'
import { dalGetPortfolioItemById, dalGetProfileIdByActorId } from '../dal/portfolioItems.read.dal.js'
import { dalReplacePortfolioTags } from '../dal/portfolioTags.write.dal.js'
import { dalListTagsByItemId } from '../dal/portfolioTags.read.dal.js'
import { emit, EVENTS } from '../events.js'

/**
 * Replace all tags for a portfolio item.
 *
 * @param {Object} params
 * @param {string} params.itemId
 * @param {string} params.actorId
 * @param {string[]} params.tags
 * @returns {Promise<string[]>}
 */
export async function manageTags({ itemId, actorId, tags }) {
  if (!itemId || !actorId) {
    throw new Error('[manageTags] itemId and actorId are required')
  }

  // PORT-V-002: fetch item and caller's profileId in parallel.
  // portfolio_items has no actor_id column — ownership is via profile_id.
  // The old gate (item.actor_id !== actorId) always threw because item.actor_id
  // was always undefined, blocking owners and non-owners alike.
  const [item, callerProfileId] = await Promise.all([
    dalGetPortfolioItemById({ itemId }),
    dalGetProfileIdByActorId({ actorId }),
  ])

  if (!item) {
    throw new Error('[manageTags] portfolio item not found')
  }

  if (item.profile_id !== callerProfileId) {
    throw new Error('[manageTags] not authorized to manage tags for this item')
  }

  const ownerCheck = await isActorOwner(actorId)
  if (!ownerCheck) {
    throw new Error('[manageTags] not authorized as this actor')
  }

  await dalReplacePortfolioTags({ itemId, tags: tags ?? [] })

  const updated = await dalListTagsByItemId({ itemId })

  emit(EVENTS.TAGS_UPDATED, { itemId, actorId, tagCount: updated.length })

  return updated.map((t) => t.tag)
}
