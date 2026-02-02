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
          created_at
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

    // group by post_id
    const byPostId = new Map();
    for (const m of list) {
      if (!m?.post_id) continue;
      if (!byPostId.has(m.post_id)) byPostId.set(m.post_id, []);
      byPostId.get(m.post_id).push({
        type: m.media_type, // 'image' | 'video'
        url: m.url,
        sortOrder: m.sort_order ?? 0,
      });
    }

    // attach media[] to each post row
    const hydrated = rows.map((p) => {
      const mediaList = byPostId.get(p.id) || [];

      // back-compat: if post_media empty, fall back to legacy single
      const fallback =
        p.media_url
          ? [{ type: p.media_type || "image", url: p.media_url, sortOrder: 0 }]
          : [];

      return {
        ...p,
        media: mediaList.length ? mediaList : fallback,
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
