// ============================================================
// Portfolio Engine — Create Portfolio Item Controller
// ============================================================

import { isActorOwner, getDebugReporter } from '../config.js'
import { dalGetProfileIdByActorId } from '../dal/portfolioItems.read.dal.js'
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
  const debug = getDebugReporter()

  if (!actorId) {
    debug?.({ step: 'CREATE_ITEM_ASSERT_FAIL', reason: 'actorId missing' })
    throw new Error('[createItem] actorId is required')
  }

  const ownerCheck = await isActorOwner(actorId)
  debug?.({ step: 'CREATE_ITEM_OWNER_CHECK', actorId, result: ownerCheck })
  if (!ownerCheck) {
    throw new Error('[createItem] not authorized as this actor')
  }

  const profileId = await dalGetProfileIdByActorId({ actorId })
  debug?.({ step: 'CREATE_ITEM_PROFILE_LOOKUP', actorId, profileId: profileId ?? null })

  if (!profileId) {
    throw new Error('[createItem] no vport profile found for this actor')
  }

  // --- Pre-insert assertion guard ---
  // created_by_actor_id is omitted (null) intentionally.
  // Passing the vport actor id here can fail RLS if vc.current_actor_id()
  // resolves to the user actor rather than the vport actor.
  // The INSERT policy allows NULL: (created_by_actor_id IS NULL OR ...).
  const insertPayload = {
    profileId,
    title,
    description,
    portfolioKind,
    serviceId,
    visibility,
    sourcePostId,
    createdByActorId: null,
  }

  debug?.({
    step: 'CREATE_ITEM_INSERT_PAYLOAD',
    actorId,
    profileId,
    createdByActorId: null,
    title: title ?? null,
    portfolioKind: portfolioKind ?? 'work',
    visibility: visibility ?? 'public',
  })

  const row = await dalInsertPortfolioItem(insertPayload)

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
