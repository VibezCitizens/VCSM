// Shared vport utility: resolves vport.profiles.id from an actor_id.
//
// Previously owned by profiles/kinds/vport/dal/services/. Moved to shared/lib/vport/
// because dashboard and profiles both require it — no single feature should own
// a resolver consumed across feature boundaries.
//
// A short TTL cache (30s) eliminates duplicate DB round-trips within a single
// page load or save operation. Cache is keyed on actorId. Only successful
// lookups are cached — caching null would poison the cache for up to 30s if
// the profile is temporarily inaccessible, causing writes to fail with
// "profile not found" even when the profile is present and accessible.

import { createTTLCache } from "@/shared/lib/ttlCache";
import vportSchema from "@/services/supabase/vportClient";

const cache = createTTLCache(30_000); // 30 seconds — profile-to-actor mapping is stable

/**
 * Resolve the vport.profiles.id for a given actorId.
 * Returns null if no profile exists for this actor.
 *
 * @param {string} actorId
 * @returns {Promise<string|null>}
 */
export async function resolveVportProfileId(actorId) {
  if (!actorId) return null;

  const cached = cache.get(actorId);
  if (cached !== null) return cached;

  const { data } = await vportSchema
    .from("profiles")
    .select("id")
    .eq("actor_id", actorId)
    .maybeSingle();

  const profileId = data?.id ?? null;

  if (profileId) {
    cache.set(actorId, profileId);
  }

  return profileId;
}

export default resolveVportProfileId;
