import { supabase } from "@/services/supabase/supabaseClient";

function makeActorRoute({ kind, username, actorId, vportId }) {
  if (kind === "user" && username) return `/u/${username}`;
  if (kind === "vport" && vportId) return `/vport/${vportId}`;
  if (actorId) return `/profile/${actorId}`;
  return "/feed";
}

export async function fetchPostsForActorDAL({ actorId, limit, offset }) {
  const { data, error } = await supabase
    .schema("vc")
    .from("posts")
    .select(`
      id,
      actor_id,
      text,
      title,
      media_url,
      media_type,
      created_at,
      edited_at,
      deleted_at,
      deleted_by_actor_id,
      location_text
    `)
    .eq("actor_id", actorId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { data, error };
  }

  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) return { data: [], error: null };

  const postIds = rows.map((r) => r.id).filter(Boolean);

  let authorActorEntry = null;

  try {
    const { data: actorRow } = await supabase
      .schema("vc")
      .from("actors")
      .select("id, kind, profile_id, vport_id")
      .eq("id", actorId)
      .maybeSingle();

    if (actorRow?.kind === "user" && actorRow?.profile_id) {
      const { data: pRow } = await supabase
        .from("profiles")
        .select("id, username, display_name, photo_url, banner_url, bio")
        .eq("id", actorRow.profile_id)
        .maybeSingle();

      authorActorEntry = {
        actor_id: actorRow.id,
        kind: "user",
        display_name: pRow?.display_name ?? pRow?.username ?? null,
        username: pRow?.username ?? null,
        photo_url: pRow?.photo_url ?? "/avatar.jpg",
        banner_url: pRow?.banner_url ?? null,
        bio: pRow?.bio ?? null,
        route: makeActorRoute({
          kind: "user",
          username: pRow?.username ?? null,
          actorId: actorRow.id,
          vportId: null,
        }),
      };
    }

    if (actorRow?.kind === "vport" && actorRow?.vport_id) {
      const { data: vRow } = await supabase
        .schema("vc")
        .from("vports")
        .select("id, slug, name, avatar_url, banner_url, bio")
        .eq("id", actorRow.vport_id)
        .maybeSingle();

      authorActorEntry = {
        actor_id: actorRow.id,
        kind: "vport",
        display_name: vRow?.name ?? vRow?.slug ?? null,
        username: vRow?.slug ?? null,
        photo_url: vRow?.avatar_url ?? "/avatar.jpg",
        banner_url: vRow?.banner_url ?? null,
        bio: vRow?.bio ?? null,
        route: makeActorRoute({
          kind: "vport",
          username: vRow?.slug ?? null,
          actorId: actorRow.id,
          vportId: actorRow.vport_id,
        }),
      };
    }
  } catch {
    // Non-fatal: return posts even if author hydration fails.
  }

  const { data: mediaRows, error: mediaErr } = await supabase
    .schema("vc")
    .from("post_media")
    .select(`post_id, url, media_type, sort_order`)
    .in("post_id", postIds)
    .order("sort_order", { ascending: true });

  if (mediaErr) return { data: null, error: mediaErr };

  const mediaList = Array.isArray(mediaRows) ? mediaRows : [];
  const mediaByPostId = new Map();

  for (const m of mediaList) {
    if (!m?.post_id) continue;
    if (!mediaByPostId.has(m.post_id)) mediaByPostId.set(m.post_id, []);
    mediaByPostId.get(m.post_id).push({
      type: m.media_type,
      url: m.url,
      sortOrder: m.sort_order ?? 0,
    });
  }

  const { data: mentionRows } = await supabase
    .schema("vc")
    .from("post_mentions")
    .select("post_id, mentioned_actor_id")
    .in("post_id", postIds);

  const safeMentionRows = Array.isArray(mentionRows) ? mentionRows : [];

  const mentionedByPostId = new Map();
  const allMentionedActorIds = new Set();

  for (const r of safeMentionRows) {
    const pid = r?.post_id ?? null;
    const aid = r?.mentioned_actor_id ?? null;
    if (!pid || !aid) continue;

    if (!mentionedByPostId.has(pid)) mentionedByPostId.set(pid, []);
    mentionedByPostId.get(pid).push(aid);
    allMentionedActorIds.add(aid);
  }

  let mentionedActors = [];
  if (allMentionedActorIds.size) {
    const { data: actors } = await supabase
      .schema("vc")
      .from("actors")
      .select("id, kind, profile_id, vport_id")
      .in("id", Array.from(allMentionedActorIds));
    mentionedActors = Array.isArray(actors) ? actors : [];
  }

  const userProfileIds = [];
  const vportIds = [];

  for (const a of mentionedActors) {
    if (a?.kind === "user" && a?.profile_id) userProfileIds.push(a.profile_id);
    if (a?.kind === "vport" && a?.vport_id) vportIds.push(a.vport_id);
  }

  const profilesById = new Map();
  if (userProfileIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, photo_url")
      .in("id", userProfileIds);
    for (const p of profiles || []) profilesById.set(p.id, p);
  }

  const vportsById = new Map();
  if (vportIds.length) {
    const { data: vports } = await supabase
      .schema("vc")
      .from("vports")
      .select("id, slug, name, avatar_url")
      .in("id", vportIds);
    for (const v of vports || []) vportsById.set(v.id, v);
  }

  const mentionEntryByActorId = new Map();
  for (const a of mentionedActors) {
    const actorUUID = a?.id ?? null;
    if (!actorUUID) continue;

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

    mentionEntryByActorId.set(actorUUID, {
      id: actorUUID,
      kind: a.kind,
      displayName,
      username,
      avatar,
      route: makeActorRoute({
        kind: a.kind,
        username,
        actorId: actorUUID,
        vportId,
      }),
    });
  }

  const mentionMapByPostId = new Map();
  for (const pid of postIds) {
    const ids = mentionedByPostId.get(pid) || [];
    if (!ids.length) continue;

    const mentionMap = {};
    for (const mentionedActorId of ids) {
      const entry = mentionEntryByActorId.get(mentionedActorId);
      if (!entry?.username) continue;
      const key = String(entry.username).toLowerCase();
      mentionMap[key] = entry;
    }

    if (Object.keys(mentionMap).length) {
      mentionMapByPostId.set(pid, mentionMap);
    }
  }

  const hydrated = rows.map((p) => {
    const media = mediaByPostId.get(p.id) || [];
    const fallback = p.media_url
      ? [{ type: p.media_type || "image", url: p.media_url, sortOrder: 0 }]
      : [];

    return {
      ...p,
      actor: authorActorEntry,
      media: media.length ? media : fallback,
      mentionMap: mentionMapByPostId.get(p.id) || {},
      location_text: p.location_text ?? null,
    };
  });

  return { data: hydrated, error: null };
}
