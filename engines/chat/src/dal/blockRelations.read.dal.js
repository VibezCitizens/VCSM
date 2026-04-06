// src/dal/blockRelations.read.dal.js
// ============================================================
// Chat Engine — Block Relations DAL
// ------------------------------------------------------------
// Delegates to the app-injected checkBlockRelation function.
// Apps must provide config.checkBlockRelation to enable
// block enforcement on direct conversation creation.
// ============================================================

import { getCheckBlockRelation, isUuid } from '../config.js'

export async function listUserBlockRowsBetweenActorsDAL({
  actorA,
  actorB,
}) {
  if (!actorA || !actorB || actorA === actorB || !isUuid(actorA) || !isUuid(actorB)) {
    return [];
  }

  const checkBlockRelation = getCheckBlockRelation()
  if (!checkBlockRelation) {
    // No app-provided block checker — assume no blocks
    return []
  }

  const isBlocked = await checkBlockRelation({ actorA, actorB })

  // Return a synthetic row array to maintain the existing interface
  // (callers check .length > 0)
  return isBlocked
    ? [{ blocker_actor_id: actorA, blocked_actor_id: actorB }]
    : []
}
