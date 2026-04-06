// src/controller/switchActiveActor.controller.js
// ============================================================
// Identity Engine — Switch Active Actor
// ------------------------------------------------------------
// Validates that the target actor link belongs to this account
// and is switchable, then persists the selection to preferences.
// ============================================================

import { dalGetActorLinkById } from '../dal/actorLinks.read.dal.js'
import { dalSetActiveActorLink } from '../dal/actorLinks.write.dal.js'
import { ActorLinkModel } from '../model/ActorLink.model.js'
import { emit, EVENTS } from '../events.js'

/**
 * Switch the active actor for an app account.
 *
 * @param {Object} params
 * @param {string} params.userAppAccountId
 * @param {string} params.actorLinkId
 * @returns {Promise<{ activeActor: import('../types/index.js').DomainActorLink }>}
 * @throws if the link is not found, not owned by this account, or not switchable
 */
export async function switchActiveActor({ userAppAccountId, actorLinkId }) {
  const row = await dalGetActorLinkById({ actorLinkId })

  if (!row) {
    throw { code: 'ACTOR_LINK_NOT_FOUND', message: `Actor link '${actorLinkId}' not found` }
  }

  if (row.user_app_account_id !== userAppAccountId) {
    throw { code: 'ACTOR_LINK_FORBIDDEN', message: 'Actor link does not belong to this account' }
  }

  if (row.status !== 'active') {
    throw { code: 'ACTOR_LINK_INACTIVE', message: 'Actor link is not active' }
  }

  if (!row.is_switchable) {
    throw { code: 'ACTOR_NOT_SWITCHABLE', message: 'This actor is not switchable' }
  }

  await dalSetActiveActorLink({ userAppAccountId, actorLinkId })

  const activeActor = ActorLinkModel(row)

  emit(EVENTS.ACTOR_SWITCHED, { userAppAccountId, actorLinkId, actorId: activeActor.actorId })

  return { activeActor }
}
