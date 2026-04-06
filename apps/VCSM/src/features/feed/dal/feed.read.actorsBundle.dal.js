import { supabase } from "@/services/supabase/supabaseClient";

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

  const { data: actors } = await supabase
    .schema("vc")
    .from("actors")
    .select("id, kind, profile_id, vport_id")
    .in("id", uniqueActorIds);

  const actorMap = {};
  (actors || []).forEach((a) => (actorMap[a.id] = a));

  const profileIds = (actors || [])
    .filter((a) => a.profile_id)
    .map((a) => a.profile_id);

  const vportIds = (actors || [])
    .filter((a) => a.vport_id)
    .map((a) => a.vport_id);

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

      vportIds.length
        ? supabase
            .schema("vc")
            .from("vports")
            .select("id, name, slug, avatar_url, is_active")
            .in("id", vportIds)
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
  (vports || []).forEach((v) => (vportMap[v.id] = v));

  return {
    actors: actors || [],
    actorMap,
    profiles: Object.values(profileMap),
    profileMap,
    vports: vports || [],
    vportMap,
  };
}
