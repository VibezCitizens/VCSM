import { supabase } from "@/services/supabase/supabaseClient";
import vportSchema from "@/services/supabase/vportClient";

function makeActorRoute({ kind, username, actorId, vportId }) {
  if (kind === "user" && username) return `/u/${username}`;
  if (kind === "vport" && vportId) return `/vport/${vportId}`;
  if (actorId) return `/profile/${actorId}`;
  return "/feed";
}

// Resolves post author identity. Uses controller-provided actor data when present; falls back to DB.
async function resolveAuthorEntry(actorId, cachedAuthorActorEntry = null) {
  if (cachedAuthorActorEntry) return cachedAuthorActorEntry;

  try {
    const { data: actorRow } = await supabase
      .schema("vc")
      .from("actors")
      .select("id, kind, profile_id, vport_id")
      .eq("id", actorId)
      .maybeSingle();

    if (!actorRow) return null;

    if (actorRow.kind === "user" && actorRow.profile_id) {
      const { data: pRow } = await supabase
        .from("profiles")
        .select("id, username, display_name, photo_url, banner_url, bio")
        .eq("id", actorRow.profile_id)
        .maybeSingle();
      return {
        actor_id: actorRow.id,
        kind: "user",
        display_name: pRow?.display_name ?? pRow?.username ?? null,
        username: pRow?.username ?? null,
        photo_url: pRow?.photo_url ?? "/avatar.jpg",
        banner_url: pRow?.banner_url ?? null,
        bio: pRow?.bio ?? null,
        route: makeActorRoute({ kind: "user", username: pRow?.username ?? null, actorId: actorRow.id, vportId: null }),
      };
    }

    if (actorRow.kind === "vport") {
      const { data: vRow } = await vportSchema
        .from("profiles")
        .select("actor_id, slug, name, avatar_url, banner_url, bio")
        .eq("actor_id", actorRow.id)
        .maybeSingle();
      return {
        actor_id: actorRow.id,
        kind: "vport",
        display_name: vRow?.name ?? vRow?.slug ?? null,
        username: vRow?.slug ?? null,
        photo_url: vRow?.avatar_url ?? "/avatar.jpg",
        banner_url: vRow?.banner_url ?? null,
        bio: vRow?.bio ?? null,
        route: makeActorRoute({ kind: "vport", username: vRow?.slug ?? null, actorId: actorRow.id, vportId: actorRow.id }),
      };
    }
  } catch {
    // Non-fatal: posts render without author data rather than crashing.
  }
  return null;
}

// Returns a Map<postId, mediaItems[]>.
async function fetchPostMedia(postIds) {
  const { data, error } = await supabase
    .schema("vc")
    .from("post_media")
    .select("post_id, url, media_type, sort_order")
    .in("post_id", postIds)
    .order("sort_order", { ascending: true });

  if (error) {
    if (import.meta.env?.DEV) {
      console.warn("[fetchPostsForActorDAL] post_media read failed; falling back to legacy media_url", {
        postCount: postIds.length,
        error: error?.message || error,
      });
    }
  }

  const map = new Map();
  for (const m of Array.isArray(data) ? data : []) {
    if (!m?.post_id) continue;
    if (!map.has(m.post_id)) map.set(m.post_id, []);
    map.get(m.post_id).push({ type: m.media_type, url: m.url, sortOrder: m.sort_order ?? 0 });
  }
  return map;
}

// Returns { byPostId: Map<postId, actorId[]>, allIds: Set<actorId> }.
async function fetchPostMentions(postIds) {
  const { data } = await supabase
    .schema("vc")
    .from("post_mentions")
    .select("post_id, mentioned_actor_id")
    .in("post_id", postIds);

  const byPostId = new Map();
  const allIds = new Set();
  for (const r of Array.isArray(data) ? data : []) {
    const pid = r?.post_id ?? null;
    const aid = r?.mentioned_actor_id ?? null;
    if (!pid || !aid) continue;
    if (!byPostId.has(pid)) byPostId.set(pid, []);
    byPostId.get(pid).push(aid);
    allIds.add(aid);
  }
  return { byPostId, allIds };
}

// Resolves display entries for all mentioned actors.
// Fetches actor rows first, then user profiles + vport profiles in parallel.
async function resolveMentionEntries(allIds) {
  if (!allIds.size) return new Map();

  const { data: actorRows } = await supabase
    .schema("vc")
    .from("actors")
    .select("id, kind, profile_id, vport_id")
    .in("id", Array.from(allIds));

  const actors = Array.isArray(actorRows) ? actorRows : [];
  const userProfileIds = actors.filter((a) => a?.kind === "user" && a?.profile_id).map((a) => a.profile_id);
  const vportActorIds = actors.filter((a) => a?.kind === "vport").map((a) => a.id);

  const [userProfileRows, vportProfileRows] = await Promise.all([
    userProfileIds.length
      ? supabase
          .from("profiles")
          .select("id, username, display_name, photo_url")
          .in("id", userProfileIds)
          .then(({ data }) => data ?? [])
      : Promise.resolve([]),
    vportActorIds.length
      ? vportSchema
          .from("profiles")
          .select("actor_id, slug, name, avatar_url")
          .in("actor_id", vportActorIds)
          .then(({ data }) => data ?? [])
      : Promise.resolve([]),
  ]);

  const profilesById = new Map();
  for (const p of userProfileRows) profilesById.set(p.id, p);

  const vportsByActorId = new Map();
  for (const v of vportProfileRows) vportsByActorId.set(v.actor_id, v);

  const entryByActorId = new Map();
  for (const a of actors) {
    const id = a?.id ?? null;
    if (!id) continue;
    let username = null, displayName = null, avatar = null, vportId = null;

    if (a.kind === "user") {
      const p = profilesById.get(a.profile_id);
      username = p?.username ?? null;
      displayName = p?.display_name ?? p?.username ?? null;
      avatar = p?.photo_url ?? "/avatar.jpg";
    } else if (a.kind === "vport") {
      const v = vportsByActorId.get(id);
      vportId = id;
      username = v?.slug ?? null;
      displayName = v?.name ?? v?.slug ?? null;
      avatar = v?.avatar_url ?? "/avatar.jpg";
    }

    if (!username) continue;
    entryByActorId.set(id, {
      id,
      kind: a.kind,
      displayName,
      username,
      avatar,
      route: makeActorRoute({ kind: a.kind, username, actorId: id, vportId }),
    });
  }
  return entryByActorId;
}

export async function fetchPostsForActorDAL({
  actorId,
  limit,
  offset,
  media = "all",
  cachedAuthorActorEntry = null,
}) {
  let query = supabase
    .schema("vc")
    .from("posts")
    .select(`
      id,
      actor_id,
      user_id,
      text,
      title,
      media_url,
      media_type,
      post_type,
      tags,
      created_at,
      edited_at,
      deleted_at,
      location_text
    `)
    .eq("actor_id", actorId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (media !== "all") query = query.eq("media_type", media);

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) return { data, error };

  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) return { data: [], error: null };

  const postIds = rows.map((r) => r.id).filter(Boolean);

  // RTT 1 complete. Fetch author, media, and mentions in parallel.
  const [authorActorEntry, mediaByPostId, { byPostId: mentionedByPostId, allIds: mentionedActorIds }] =
    await Promise.all([
      resolveAuthorEntry(actorId, cachedAuthorActorEntry),
      fetchPostMedia(postIds),
      fetchPostMentions(postIds),
    ]);

  // Mention actor resolution: vc.actors first, then user+vport profiles in parallel.
  const mentionEntryByActorId = await resolveMentionEntries(mentionedActorIds);

  const mentionMapByPostId = new Map();
  for (const pid of postIds) {
    const ids = mentionedByPostId.get(pid) || [];
    if (!ids.length) continue;
    const mentionMap = {};
    for (const aid of ids) {
      const entry = mentionEntryByActorId.get(aid);
      if (!entry?.username) continue;
      mentionMap[String(entry.username).toLowerCase()] = entry;
    }
    if (Object.keys(mentionMap).length) mentionMapByPostId.set(pid, mentionMap);
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
