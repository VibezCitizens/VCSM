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

    return {
      rows,
      done: rows.length < pageSize,
    };
  } catch (err) {
    console.error("[profilePosts.bridge] fetchPostsForActor failed:", err);
    throw err;
  }
}
