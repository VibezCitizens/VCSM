// src/features/notifications/inbox/lib/resolveInboxActor.js

import { resolveVportOwnerActorId } from '../controller/resolveVportOwnerActor.controller'

/**
 * resolveInboxActor(identity)
 *
 * Identity is already resolved upstream (SSOT).
 * This function only adapts identity -> inbox semantics.
 *
 * Identity shape (LOCKED):
 * {
 *   kind: "user" | "vport",
 *   actorId,
 * }
 *
 * For vport identities, the owner citizen actor is resolved from
 * actor_owners via resolveVportOwnerActorId — never read from identity.
 */
export async function resolveInboxActor(identity) {
  if (!identity || !identity.actorId || !identity.kind) {
    return {
      targetActorId: null,
      myActorId: null,
    }
  }

  if (identity.kind === 'user') {
    return {
      targetActorId: identity.actorId,
      myActorId: identity.actorId,
    }
  }

  if (identity.kind === 'vport') {
    const ownerActorId = await resolveVportOwnerActorId(identity.actorId)
    if (!ownerActorId) {
      if (import.meta.env.DEV) {
        console.error(
          '[resolveInboxActor] Could not resolve owner actor for vport',
          identity.actorId
        )
      }
      return {
        targetActorId: identity.actorId,
        myActorId: null,
      }
    }
    return {
      targetActorId: identity.actorId,
      myActorId: ownerActorId,
    }
  }

  if (import.meta.env.DEV) {
    console.warn('[resolveInboxActor] Unknown identity kind', identity)
  }

  return {
    targetActorId: null,
    myActorId: null,
  }
}
