import { getVportProfileIdByActorIdDAL } from "@/features/booking/dal/getVportProfileIdByActorId.dal";

/**
 * Controller: resolve a VPORT actor's internal vport.profiles.id from actorId.
 *
 * Translation layer between the canonical app identity surface (actorId) and
 * the booking engine's internal profileId. Hooks must route through this
 * controller rather than calling the DAL directly (SENTRY fix — 27-03/27-04).
 *
 * Returns null if no profile is found for the given actorId — callers must
 * handle null gracefully (treat as "not a VPORT actor with a profile").
 *
 * @param {string|null} actorId — VCSM actor ID (kind='vport')
 * @returns {Promise<string|null>} vport.profiles.id or null
 */
export async function resolveVportProfileIdController({ actorId } = {}) {
  if (!actorId) return null;
  return getVportProfileIdByActorIdDAL({ actorId });
}
