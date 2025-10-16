// src/features/post/lib/commentReactions.js
import { supabase } from '@/lib/supabaseClient';
import { getCurrentActorId } from '@/lib/actors/actors';

/**
 * Toggle like for a single comment (heart).
 * Uses SECURITY DEFINER RPC (owner = postgres) so it bypasses RLS safely.
 *
 * Returns:
 *  { found: boolean, liked: boolean, likeCount: number }
 */
export async function toggleCommentLike(commentId) {
  if (!commentId) throw new Error('toggleCommentLike: commentId required');

  const actorId = await getCurrentActorId({});
  if (!actorId) throw new Error('toggleCommentLike: no current actor');

  const { data, error } = await supabase
    .schema('vc')
    .rpc('comment_like_toggle', {
      p_comment_id: commentId,
      p_actor_id: actorId,
    });

  if (error) throw error;

  const row = Array.isArray(data) && data[0] ? data[0] : null;
  return {
    found: !!row?.found,
    liked: !!row?.liked,
    likeCount: Number(row?.like_count ?? 0),
  };
}

/**
 * Check if the current user (via their actor) liked a given comment.
 * Returns true/false.
 */
export async function isCommentLikedByMe(commentId) {
  if (!commentId) return false;

  const actorId = await getCurrentActorId({});
  if (!actorId) return false;

  const { count, error } = await supabase
    .schema('vc')
    .from('comment_likes')
    .select('comment_id', { count: 'exact', head: true })
    .eq('comment_id', commentId)
    .eq('actor_id', actorId);

  if (error) throw error;
  return (count ?? 0) > 0;
}

/**
 * Get like counts for many comments at once.
 * Returns a Map<commentId, count>.
 *
 * Note: This uses a single grouped query and reduces client-side.
 */
export async function getCommentLikeCounts(commentIds) {
  const ids = Array.from(new Set((commentIds || []).filter(Boolean)));
  const map = new Map();
  if (ids.length === 0) return map;

  // Fetch only the columns we need and group client-side
  const { data, error } = await supabase
    .schema('vc')
    .from('comment_likes')
    .select('comment_id')
    .in('comment_id', ids);

  if (error) throw error;

  for (const row of data || []) {
    const cid = row.comment_id;
    map.set(cid, (map.get(cid) ?? 0) + 1);
  }
  // Ensure all requested ids are present (zero default)
  for (const id of ids) {
    if (!map.has(id)) map.set(id, 0);
  }
  return map;
}

export default {
  toggleCommentLike,
  isCommentLikedByMe,
  getCommentLikeCounts,
};
