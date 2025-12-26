import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Hydrate reactions (like state + counts) for comments
 * Returns raw-comment-shaped rows
 */
export async function hydrateCommentReactions({
  comments,
  actorId,
}) {
  if (!Array.isArray(comments) || comments.length === 0) {
    return comments;
  }

  const commentIds = comments.map(c => c.id);

  /* --------------------------------------------------
     LIKE COUNTS
     -------------------------------------------------- */
  const { data: counts, error: countError } = await supabase
    .schema("vc")
    .from("comment_likes")
    .select("comment_id", { count: "exact" })
    .in("comment_id", commentIds);

  if (countError) throw countError;

  const countMap = {};
  for (const row of counts || []) {
    countMap[row.comment_id] =
      (countMap[row.comment_id] || 0) + 1;
  }

  /* --------------------------------------------------
     IS LIKED BY VIEWER
     -------------------------------------------------- */
  let likedSet = new Set();

  if (actorId) {
    const { data: liked, error: likedError } = await supabase
      .schema("vc")
      .from("comment_likes")
      .select("comment_id")
      .eq("actor_id", actorId)
      .in("comment_id", commentIds);

    if (likedError) throw likedError;

    likedSet = new Set(liked?.map(r => r.comment_id));
  }

  /* --------------------------------------------------
     MERGE INTO RAW COMMENT SHAPE
     -------------------------------------------------- */
  return comments.map(c => ({
    ...c,
    is_liked: likedSet.has(c.id),
    like_count: countMap[c.id] ?? 0,
  }));
}
