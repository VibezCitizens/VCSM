// ============================================================
// Profile → Posts Bridge
// ------------------------------------------------------------
// - Read-only
// - Actor-based (STRICT)
// - Profile-safe
// - NO joins
// - NO presentation logic
// - NO identity resolution
// - 🔒 actorId is ALWAYS an ACTOR UUID
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

function makeActorRoute({ kind, username, actorId, vportId }) {
  if (kind === "user" && username) return `/u/${username}`;
  if (kind === "vport" && vportId) return `/vport/${vportId}`;
  if (actorId) return `/profile/${actorId}`;
  return "/feed";
}

/**
 * fetchPostsForActor
 *
 * @param {Object} params
 * @param {string} params.actorId   - REQUIRED actor UUID
 * @param {number} params.page      - zero-based page index
 * @param {number} params.pageSize  - rows per page
 * @param {string} params.media     - "text" | "image" | "video" | "all"
 *
 * @returns {Promise<{ rows: Array, done: boolean }>}
 */
export async function fetchPostsForActor({
  actorId,
  page = 0,
  pageSize = 20,
  media = "all",
}) {
  // ------------------------------------------------------------
  // HARD GUARD
  // ------------------------------------------------------------
  if (!actorId) {
    console.warn("[profilePosts.bridge] missing actorId");
    return { rows: [], done: true };
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .schema("vc")
      .from("posts")
      .select(
        `
          id,
          actor_id,
          text,
          title,
          media_type,
          media_url,
          post_type,
          tags,
          created_at,
          location_text
        `
      )
      .eq("actor_id", actorId)
      .order("created_at", { ascending: false })
      .range(from, to);

    // ----------------------------------------------------------
    // Media filter (optional)
    // NOTE: This filters by the legacy "first media" field.
    // Multi-media posts still have media_type set to the first item.
    // ----------------------------------------------------------
    if (media !== "all") {
      query = query.eq("media_type", media);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[profilePosts.bridge] query failed:", error);
      throw error;
    }

    const rows = Array.isArray(data) ? data : [];
    if (!rows.length) {
      return { rows: [], done: true };
    }

    // ----------------------------------------------------------
    // ✅ Hydrate multi-media (NO joins)
    // ----------------------------------------------------------
    const postIds = rows.map((r) => r.id).filter(Boolean);

    const { data: mediaRows, error: mediaErr } = await supabase
      .schema("vc")
      .from("post_media")
      .select(`post_id, url, media_type, sort_order`)
      .in("post_id", postIds)
      .order("sort_order", { ascending: true });

    if (mediaErr) {
      console.error("[profilePosts.bridge] post_media query failed:", mediaErr);
      throw mediaErr;
    }

    const list = Array.isArray(mediaRows) ? mediaRows : [];

    // group media by post_id
    const mediaByPostId = new Map();
    for (const m of list) {
      if (!m?.post_id) continue;
      if (!mediaByPostId.has(m.post_id)) mediaByPostId.set(m.post_id, []);
      mediaByPostId.get(m.post_id).push({
        type: m.media_type, // 'image' | 'video'
        url: m.url,
        sortOrder: m.sort_order ?? 0,
      });
    }

    // ----------------------------------------------------------
    // ✅ Hydrate mentions (NO joins)
    // - builds mentionMap per post:
    //   { "username": { id, kind, displayName, username, avatar, route } }
    // ----------------------------------------------------------
    const { data: mentionRows, error: mentionErr } = await supabase
      .schema("vc")
      .from("post_mentions")
      .select("post_id, mentioned_actor_id")
      .in("post_id", postIds);

    if (mentionErr) {
      console.warn(
        "[profilePosts.bridge] post_mentions query failed:",
        mentionErr
      );
    }

    const safeMentionRows = Array.isArray(mentionRows) ? mentionRows : [];

    // group mentioned_actor_ids by post_id
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

    // load actors for mentioned ids
    let mentionedActors = [];
    if (allMentionedActorIds.size) {
      const { data: actors, error: actorsErr } = await supabase
        .schema("vc")
        .from("actors")
        .select("id, kind, profile_id, vport_id")
        .in("id", Array.from(allMentionedActorIds));

      if (actorsErr) {
        console.warn("[profilePosts.bridge] actors fetch failed:", actorsErr);
      } else {
        mentionedActors = Array.isArray(actors) ? actors : [];
      }
    }

    // split ids to fetch presentation handles
    const userProfileIds = [];
    const vportIds = [];

    for (const a of mentionedActors) {
      if (a?.kind === "user" && a?.profile_id) userProfileIds.push(a.profile_id);
      if (a?.kind === "vport" && a?.vport_id) vportIds.push(a.vport_id);
    }

    // load user profiles (username is needed for handle matching)
    const profilesById = new Map();
    if (userProfileIds.length) {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, username, display_name, photo_url")
        .in("id", userProfileIds);

      if (pErr) {
        console.warn("[profilePosts.bridge] profiles fetch failed:", pErr);
      } else {
        for (const p of profiles || []) profilesById.set(p.id, p);
      }
    }

    // load vports
    const vportsById = new Map();
    if (vportIds.length) {
      const { data: vports, error: vErr } = await supabase
        .schema("vc")
        .from("vports")
        .select("id, slug, name, avatar_url")
        .in("id", vportIds);

      if (vErr) {
        console.warn("[profilePosts.bridge] vports fetch failed:", vErr);
      } else {
        for (const v of vports || []) vportsById.set(v.id, v);
      }
    }

    // helper: build a lookup actorId -> mention entry
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

    // build mentionMap per post (keyed by lowercase handle)
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

    // ----------------------------------------------------------
    // attach media[] + mentionMap + location_text to each post row
    // ----------------------------------------------------------
    const hydrated = rows.map((p) => {
      const mediaList = mediaByPostId.get(p.id) || [];

      // back-compat: if post_media empty, fall back to legacy single
      const fallback =
        p.media_url
          ? [{ type: p.media_type || "image", url: p.media_url, sortOrder: 0 }]
          : [];

      const mentionMap = mentionMapByPostId.get(p.id) || {};

      return {
        ...p,
        media: mediaList.length ? mediaList : fallback,
        mentionMap,
        // keep the db field as-is; view/model can map it to locationText if desired
        location_text: p.location_text ?? null,
      };
    });

    return {
      rows: hydrated,
      done: rows.length < pageSize,
    };
  } catch (err) {
    console.error("[profilePosts.bridge] fetchPostsForActor failed:", err);
    throw err;
  }
}
