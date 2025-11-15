// src/features/chat/identity/actorIdFromIdentity.js
// Adapter: turn IdentityContext.identity -> concrete vc.actors.id
// Works for both user and vport personas. Uses your existing resolvers.
// No database triggers/functions required.

import { getActorIdForUser, getActorIdForVport } from "@/lib/actors/actors";
import { setCurrentActorIdLocal } from "@/lib/actors/actor";

/**
 * @typedef {Object} Identity
 * @property {'user'|'vport'} type
 * @property {string|null} userId
 * @property {string|null} [vportId]
 * @property {string|null} [actorId]  // optional, if already known
 */

/**
 * Resolve a concrete actor_id (vc.actors.id) for the given identity.
 * Optionally caches the resolved id in the local actor store for instant reuse.
 *
 * @param {Identity|null} identity
 * @param {{ cacheLocal?: boolean }} [options]
 * @returns {Promise<string>} actor_id
 */
export async function actorIdFromIdentity(identity, options = {}) {
  const { cacheLocal = true } = options;

  if (!identity) throw new Error("actorIdFromIdentity: identity required");

  // If already known, return immediately.
  if (identity.actorId) {
    if (cacheLocal) setCurrentActorIdLocal(identity.actorId);
    return identity.actorId;
  }

  let actorId = null;

  if (identity.type === "user") {
    if (!identity.userId) throw new Error("actorIdFromIdentity: userId missing");
    actorId = await getActorIdForUser(identity.userId); // may create if self
  } else if (identity.type === "vport") {
    if (!identity.vportId) throw new Error("actorIdFromIdentity: vportId missing");
    actorId = await getActorIdForVport(identity.vportId); // owner-only via RLS
  } else {
    throw new Error("actorIdFromIdentity: unsupported identity type");
  }

  if (!actorId) {
    throw new Error("actorIdFromIdentity: could not resolve actor_id");
  }

  if (cacheLocal) setCurrentActorIdLocal(actorId);
  return actorId;
}

export default actorIdFromIdentity;
