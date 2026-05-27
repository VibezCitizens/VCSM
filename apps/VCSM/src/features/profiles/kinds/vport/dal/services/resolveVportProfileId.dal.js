// src/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal.js
//
// Shared helper: resolves vport.profiles.id from an actor_id.
//
// Previously each DAL (readVportServicesByActor, readVportServiceAddonsByActor,
// upsertVportServicesByActor) declared its own private resolveProfileId function.
// That caused 2 identical vport.profiles queries on every read call (services +
// addons each resolved independently) and 1 more on every write.
//
// This module is the single source. A short TTL cache (30s) eliminates the
// duplicate DB round-trips within a single page load or save operation.
//
// Cache is keyed on actorId. Reads are cheap (single-row SELECT by eq) but
// the triple call pattern on every services load added latency on cold paths.

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
  if (cached !== undefined) return cached;

  const { data } = await vportSchema
    .from("profiles")
    .select("id")
    .eq("actor_id", actorId)
    .maybeSingle();

  const profileId = data?.id ?? null;
  cache.set(actorId, profileId);
  return profileId;
}

export default resolveVportProfileId;
