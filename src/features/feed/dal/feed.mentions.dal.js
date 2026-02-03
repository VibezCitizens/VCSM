import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Returns rows shaped for buildMentionMaps:
 * [{ post_id, mentioned_actor_id, username, slug }]
 */
export async function fetchPostMentionRows(postIds) {
  const ids = Array.isArray(postIds) ? postIds.filter(Boolean) : [];
  if (!ids.length) return [];

  // edges
  const { data: edges, error: eErr } = await supabase
    .schema("vc")
    .from("post_mentions")
    .select("post_id, mentioned_actor_id")
    .in("post_id", ids);

  if (eErr) {
    console.warn("[fetchPostMentionRows] post_mentions failed:", eErr);
    return [];
  }

  const safeEdges = Array.isArray(edges) ? edges : [];
  if (!safeEdges.length) return [];

  const mentionedActorIds = [
    ...new Set(safeEdges.map((e) => e.mentioned_actor_id).filter(Boolean)),
  ];
  if (!mentionedActorIds.length) return [];

  // actors -> profile_id/vport_id
  const { data: actors, error: aErr } = await supabase
    .schema("vc")
    .from("actors")
    .select("id, profile_id, vport_id")
    .in("id", mentionedActorIds);

  if (aErr) throw aErr;

  const actorById = {};
  (actors || []).forEach((a) => (actorById[a.id] = a));

  const profileIds = (actors || []).map((a) => a.profile_id).filter(Boolean);
  const vportIds = (actors || []).map((a) => a.vport_id).filter(Boolean);

  const { data: profiles, error: pErr } = profileIds.length
    ? await supabase.from("profiles").select("id, username").in("id", profileIds)
    : { data: [], error: null };

  if (pErr) throw pErr;

  const { data: vports, error: vErr } = vportIds.length
    ? await supabase.schema("vc").from("vports").select("id, slug").in("id", vportIds)
    : { data: [], error: null };

  if (vErr) throw vErr;

  const usernameByProfileId = {};
  (profiles || []).forEach((p) => (usernameByProfileId[p.id] = p.username));

  const slugByVportId = {};
  (vports || []).forEach((v) => (slugByVportId[v.id] = v.slug));

  // enrich edges with username/slug so buildMentionMaps works
  return safeEdges.map((e) => {
    const a = actorById[e.mentioned_actor_id];
    return {
      ...e,
      username: a?.profile_id ? usernameByProfileId[a.profile_id] : null,
      slug: a?.vport_id ? slugByVportId[a.vport_id] : null,
    };
  });
}

/**
 * ✅ Backwards-compatible alias (in case some code imports a different name)
 */
export const readPostMentionRows = fetchPostMentionRows;
