import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Returns rows:
 * [
 *   { post_id, mentioned_actor_id, kind, username, slug }
 * ]
 *
 * - user actors => profiles.username via actors.profile_id
 * - vport actors => vports.slug via actors.vport_id
 */
export async function findPostMentionsByPostIds(postIds) {
  const ids = Array.isArray(postIds) ? postIds.filter(Boolean) : [];
  if (ids.length === 0) return [];

  // 1) mentions rows
  const { data: mentions, error: mErr } = await supabase
    .schema("vc")
    .from("post_mentions")
    .select("post_id, mentioned_actor_id")
    .in("post_id", ids);

  if (mErr) throw mErr;
  if (!mentions?.length) return [];

  const actorIds = [...new Set(mentions.map((r) => r.mentioned_actor_id).filter(Boolean))];

  // 2) actor rows for those actorIds
  const { data: actors, error: aErr } = await supabase
    .schema("vc")
    .from("actors")
    .select("id, kind, profile_id, vport_id")
    .in("id", actorIds);

  if (aErr) throw aErr;

  const profileIds = [...new Set((actors || []).map((a) => a.profile_id).filter(Boolean))];
  const vportIds = [...new Set((actors || []).map((a) => a.vport_id).filter(Boolean))];

  // 3) profile usernames
  let profiles = [];
  if (profileIds.length) {
    const { data, error } = await supabase
      .schema("public")
      .from("profiles")
      .select("id, username")
      .in("id", profileIds);
    if (error) throw error;
    profiles = data || [];
  }

  // 4) vport slugs
  let vports = [];
  if (vportIds.length) {
    const { data, error } = await supabase
      .schema("vc")
      .from("vports")
      .select("id, slug")
      .in("id", vportIds);
    if (error) throw error;
    vports = data || [];
  }

  const usernameByProfileId = new Map(
    profiles.map((p) => [p.id, String(p.username || "").toLowerCase()])
  );
  const slugByVportId = new Map(
    vports.map((v) => [v.id, String(v.slug || "").toLowerCase()])
  );

  const actorById = new Map();
  for (const a of actors || []) actorById.set(a.id, a);

  // 5) stitch
  return (mentions || []).map((m) => {
    const a = actorById.get(m.mentioned_actor_id);
    const username = a?.profile_id ? usernameByProfileId.get(a.profile_id) : null;
    const slug = a?.vport_id ? slugByVportId.get(a.vport_id) : null;

    return {
      post_id: m.post_id,
      mentioned_actor_id: m.mentioned_actor_id,
      kind: a?.kind || null,
      username: username || null,
      slug: slug || null,
    };
  });
}
