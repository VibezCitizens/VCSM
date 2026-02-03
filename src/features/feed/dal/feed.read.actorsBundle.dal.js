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

  const { data: profiles } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, username, photo_url, private")
        .in("id", profileIds)
    : { data: [] };

  const profileMap = {};
  (profiles || []).forEach((p) => (profileMap[p.id] = p));

  const vportIds = (actors || [])
    .filter((a) => a.vport_id)
    .map((a) => a.vport_id);

  const { data: vports } = vportIds.length
    ? await supabase
        .schema("vc")
        .from("vports")
        .select("id, name, slug, avatar_url, is_active")
        .in("id", vportIds)
    : { data: [] };

  const vportMap = {};
  (vports || []).forEach((v) => (vportMap[v.id] = v));

  return { actors: actors || [], actorMap, profiles: profiles || [], profileMap, vports: vports || [], vportMap };
}
