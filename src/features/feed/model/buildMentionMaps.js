// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\feed\model\buildMentionMaps.js
import { supabase } from "@/services/supabase/supabaseClient";

function makeActorRoute({ kind, username, actorId, vportId }) {
  if (kind === "user" && username) return `/u/${username}`;
  if (kind === "vport" && vportId) return `/vport/${vportId}`;
  if (actorId) return `/profile/${actorId}`;
  return "/feed";
}

export async function buildMentionMaps(mentionRows) {
  const rows = Array.isArray(mentionRows) ? mentionRows : [];
  if (rows.length === 0) return {};

  // 1) group mentioned actor ids
  const mentionedActorIds = Array.from(
    new Set(rows.map((r) => r?.mentioned_actor_id).filter(Boolean))
  );

  if (mentionedActorIds.length === 0) return {};

  // 2) load vc.actors for mentioned actors
  const { data: actors, error: actorsErr } = await supabase
    .schema("vc")
    .from("actors")
    .select("id, kind, profile_id, vport_id")
    .in("id", mentionedActorIds);

  if (actorsErr) {
    console.warn("[buildMentionMaps] actors fetch failed:", actorsErr);
    return {};
  }

  const userProfileIds = [];
  const vportIds = [];

  for (const a of actors || []) {
    if (a?.kind === "user" && a?.profile_id) userProfileIds.push(a.profile_id);
    if (a?.kind === "vport" && a?.vport_id) vportIds.push(a.vport_id);
  }

  // 3) load profiles
  const profilesById = new Map();
  if (userProfileIds.length > 0) {
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, username, display_name, photo_url")
      .in("id", userProfileIds);

    if (pErr) {
      console.warn("[buildMentionMaps] profiles fetch failed:", pErr);
    } else {
      for (const p of profiles || []) profilesById.set(p.id, p);
    }
  }

  // 4) load vports
  const vportsById = new Map();
  if (vportIds.length > 0) {
    const { data: vports, error: vErr } = await supabase
      .schema("vc")
      .from("vports")
      .select("id, slug, name, avatar_url")
      .in("id", vportIds);

    if (vErr) {
      console.warn("[buildMentionMaps] vports fetch failed:", vErr);
    } else {
      for (const v of vports || []) vportsById.set(v.id, v);
    }
  }

  // 5) actor_id -> presentation (handle key + payload)
  const presentationByActorId = new Map();

  for (const a of actors || []) {
    const actorId = a?.id;
    if (!actorId) continue;

    let username = null;
    let displayName = null;
    let avatar = null;
    let vportId = null;

    if (a.kind === "user") {
      const p = profilesById.get(a.profile_id);
      username = p?.username ?? null;
      displayName = p?.display_name ?? p?.username ?? null;
      avatar = p?.photo_url ?? "/avatar.jpg";
    } else if (a.kind === "vport") {
      vportId = a.vport_id ?? null;
      const v = vportsById.get(a.vport_id);
      username = v?.slug ?? null;
      displayName = v?.name ?? v?.slug ?? null;
      avatar = v?.avatar_url ?? "/avatar.jpg";
    }

    if (!username) continue;

    const handleKey = String(username).toLowerCase();

    presentationByActorId.set(actorId, {
      handleKey,
      payload: {
        id: actorId,
        kind: a.kind,
        displayName,
        username,
        avatar,
        route: makeActorRoute({
          kind: a.kind,
          username,
          actorId,
          vportId,
        }),
      },
    });
  }

  // 6) build per-post maps keyed by handleKey
  const mentionMapsByPostId = {};

  for (const r of rows) {
    const postId = r?.post_id;
    const mentionedId = r?.mentioned_actor_id;
    if (!postId || !mentionedId) continue;

    const pres = presentationByActorId.get(mentionedId);
    if (!pres?.handleKey || !pres?.payload) continue;

    if (!mentionMapsByPostId[postId]) mentionMapsByPostId[postId] = {};
    mentionMapsByPostId[postId][pres.handleKey] = pres.payload;
  }

  return mentionMapsByPostId;
}
