// ============================================================
// Feed Posts DAL
// ------------------------------------------------------------
// Responsibility:
// - Read feed posts
// - Resolve actor presentation for UI
// - Aggregate comment counts
//
// @Domain: Feed
// @ReadModel: FeedPost
// @ActorModel: actor_presentation
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Fetch feed posts with resolved actor presentation.
 *
 * Returns:
 * [
 *   {
 *     id,
 *     text,
 *     created_at,
 *     actor: {
 *       id,
 *       kind,
 *       displayName,
 *       username,
 *       avatar
 *     },
 *     comment_count
 *   }
 * ]
 */
export async function listFeedPosts({ limit = 20 } = {}) {
  const { data, error } = await supabase
    .schema("vc")
    .from("posts")
    .select(`
      id,
      actor_id,
      text,
      created_at,

      actor:actors!posts_actor_id_fkey (
        id,
        kind,

        presentation:actor_presentation (
          display_name,
          username,
          photo_url,

          vport_name,
          vport_slug,
          vport_avatar_url
        )
      ),

      comment_count:post_comments (
        count
      )
    `)
    .eq("post_comments.parent_id", null)
    .is("post_comments.deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[FeedPostsDAL] listFeedPosts error:", error);
    throw error;
  }

  if (!data) {
    console.warn("[FeedPostsDAL] No data returned");
    return [];
  }

  /* ============================================================
     🔎 RAW SUPABASE DEBUG
     ============================================================ */
  console.groupCollapsed("[FeedPostsDAL] RAW DATA");
  data.forEach((row, i) => {
    console.log(`#${i}`, {
      postId: row.id,
      actorId: row.actor?.id,
      actorKind: row.actor?.kind,
      presentation: row.actor?.presentation,
    });
  });
  console.groupEnd();

  return data.map((post, index) => {
    const actor = post.actor;
    const p = actor?.presentation;

    /* ============================================================
       🔎 ACTOR NORMALIZATION DEBUG
       ============================================================ */
    if (actor?.kind === "vport") {
      console.groupCollapsed(
        `[FeedPostsDAL][VPORT][${index}] actor_id=${actor.id}`
      );
      console.log("presentation.vport_name:", p?.vport_name);
      console.log("presentation.vport_slug:", p?.vport_slug);
      console.log("presentation.vport_avatar_url:", p?.vport_avatar_url);
      console.log("presentation.photo_url:", p?.photo_url);
      console.groupEnd();
    }

    if (actor?.kind === "user") {
      console.groupCollapsed(
        `[FeedPostsDAL][USER][${index}] actor_id=${actor.id}`
      );
      console.log("presentation.display_name:", p?.display_name);
      console.log("presentation.username:", p?.username);
      console.log("presentation.photo_url:", p?.photo_url);
      console.groupEnd();
    }

    const normalizedActor = actor
      ? {
          id: actor.id,
          kind: actor.kind,

          displayName:
            actor.kind === "vport"
              ? p?.vport_name ?? null
              : p?.display_name ?? null,

          username:
            actor.kind === "vport"
              ? p?.vport_slug ?? null
              : p?.username ?? null,

          avatar:
            actor.kind === "vport"
              ? p?.vport_avatar_url ?? null
              : p?.photo_url ?? null,
        }
      : null;

    /* ============================================================
       🔎 FINAL UI SHAPE DEBUG
       ============================================================ */
    console.debug("[FeedPostsDAL][FINAL]", {
      postId: post.id,
      actor: normalizedActor,
    });

    return {
      id: post.id,
      text: post.text,
      created_at: post.created_at,
      actor: normalizedActor,
      comment_count: post.comment_count?.[0]?.count ?? 0,
    };
  });
}
