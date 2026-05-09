import { supabase } from "@/services/supabase/supabaseClient";
import { createTTLCache } from "@/shared/lib/ttlCache";
import vportSchema from "@/services/supabase/vportClient";

// 30s TTL — prevents repeated reads across feed pagination pages.
// Same actors appearing on page 1 and page 2 hit cache on page 2.
const bundleCache = createTTLCache(30_000);

export function invalidateActorsBundleCache() {
  bundleCache.invalidateAll();
}

export async function readActorsBundle(actorIds) {
  const uniqueActorIds = [...new Set((actorIds || []).filter(Boolean))];
  if (uniqueActorIds.length === 0) {
    return {
      actors: [],
      actorMap: {},
      profiles: [],
      profileMap: {},
      vports: [],
      vportMap: {},
    };
  }

  // Check cache: split into cached vs uncached actor IDs
  const cachedActors = [];
  const uncachedIds = [];
  for (const id of uniqueActorIds) {
    const cached = bundleCache.get(`actor:${id}`);
    if (cached) {
      cachedActors.push(cached);
    } else {
      uncachedIds.push(id);
    }
  }

  // If all actors are cached, return merged result from cache
  if (uncachedIds.length === 0) {
    return buildBundleResult(cachedActors);
  }

  // Fetch only uncached actors
  const { data: actors } = await supabase
    .schema("vc")
    .from("actors")
    .select("id, kind, profile_id, vport_id")
    .in("id", uncachedIds);

  const actorMap = {};
  (actors || []).forEach((a) => (actorMap[a.id] = a));

  const profileIds = (actors || [])
    .filter((a) => a.profile_id)
    .map((a) => a.profile_id);

  const actorIdsForVports = (actors || []).map((a) => a.id).filter(Boolean);

  // Resolve dependent bundles in parallel to reduce round-trips.
  const [{ data: profiles }, { data: privacyRows }, { data: vports }] =
    await Promise.all([
      profileIds.length
        ? supabase
            .from("profiles")
            .select("id, display_name, username, photo_url")
            .in("id", profileIds)
        : Promise.resolve({ data: [] }),

      uniqueActorIds.length
        ? supabase
            .schema("vc")
            .from("actor_privacy_settings")
            .select("actor_id, is_private")
            .in("actor_id", uniqueActorIds)
        : Promise.resolve({ data: [] }),

      actorIdsForVports.length
        ? vportSchema
            .from("public_traze_profiles_v")
            .select("actor_id, name, slug, avatar_url, is_active")
            .in("actor_id", actorIdsForVports)
        : Promise.resolve({ data: [] }),
    ]);

  const profileBaseMap = {};
  (profiles || []).forEach((p) => (profileBaseMap[p.id] = p));

  const actorPrivacyMap = new Map(
    (privacyRows || []).map((row) => [row.actor_id, row.is_private === true])
  );

  const profileMap = {};
  for (const actor of actors || []) {
    if (!actor?.profile_id) continue;
    const profile = profileBaseMap[actor.profile_id];
    if (!profile) continue;

    profileMap[actor.profile_id] = {
      ...profile,
      private: actorPrivacyMap.get(actor.id) ?? false,
    };
  }

  const vportMap = {};
  (vports || []).forEach((v) => { if (v.actor_id) vportMap[v.actor_id] = v; });

  // Cache each fetched actor's full bundle for cross-page reuse
  for (const actor of actors || []) {
    bundleCache.set(`actor:${actor.id}`, {
      actor,
      profile: actor.profile_id ? profileMap[actor.profile_id] ?? null : null,
      vport: vportMap[actor.id] ?? null,
    });
  }

  // Merge fetched results with cached actors
  const allActorBundles = [...cachedActors];
  for (const actor of actors || []) {
    allActorBundles.push({
      actor,
      profile: actor.profile_id ? profileMap[actor.profile_id] ?? null : null,
      vport: vportMap[actor.id] ?? null,
    });
  }

  return buildBundleResult(allActorBundles);
}

/**
 * Reconstruct the standard bundle return shape from per-actor cached entries.
 */
function buildBundleResult(bundles) {
  const actors = [];
  const actorMap = {};
  const profileMap = {};
  const vportMap = {};

  for (const b of bundles) {
    const a = b.actor;
    if (!a) continue;
    actors.push(a);
    actorMap[a.id] = a;
    if (b.profile && a.profile_id) profileMap[a.profile_id] = b.profile;
    if (b.vport) vportMap[a.id] = b.vport;
  }

  return {
    actors,
    actorMap,
    profiles: Object.values(profileMap),
    profileMap,
    vports: Object.values(vportMap),
    vportMap,
  };
}
