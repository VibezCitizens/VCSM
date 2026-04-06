// src/dal/actorRealm.read.dal.js
// ============================================================
// Chat Engine — Actor Realm Context DAL
// ------------------------------------------------------------
// Delegates to the app-injected resolveActorRealmContext function.
// Apps must provide config.resolveActorRealmContext to enable
// realm routing based on actor properties.
// ============================================================

import { getResolveActorRealmContext } from '../config.js'

export async function readActorRealmContextDAL({ actorId }) {
  if (!actorId) {
    throw new Error("readActorRealmContextDAL: actorId required");
  }

  const resolveActorRealmContext = getResolveActorRealmContext()
  if (!resolveActorRealmContext) {
    // No app-provided resolver — return null (caller will use resolveRealm(false) fallback)
    return null
  }

  return resolveActorRealmContext({ actorId })
}
