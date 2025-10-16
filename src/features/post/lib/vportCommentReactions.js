// src/features/post/lib/vportCommentReactions.js
// Handles comment reactions (likes) specifically as a VPORT actor.

import { supabase } from '@/lib/supabaseClient';
import { getCurrentActorId } from '@/lib/actors/actors';

/**
 * Toggle like on a comment as the current VPORT actor.
 * Uses SECURITY DEFINER RPC (owner=postgres) for bypassing RLS safely.
 *
 * Returns:
 *  { found: boolean, liked: boolean, likeCount: number }
 */
export async function toggleVportCommentLike(commentId, vportId) {
  if (!commentId) throw new Error('toggleVportCommentLike: commentId required');
  if (!vportId) throw new Error('toggleVportCommentLike: vportId required');

  // Resolve actor specifically for this vport
  const actorId = await getCurrentActorId({ activeVportId: vportId });
  if (!actorId) throw new Error('toggleVportCommentLike: no actor for vport');

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
 * Check if this VPORT liked a comment.
 * Returns true/false.
 */
export async function isVportCommentLiked(commentId, vportId) {
  if (!commentId || !vportId) return false;

  const actorId = await getCurrentActorId({ activeVportId: vportId });
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
 * Same as user version, but can be used for vport dashboards.
 */
export async function getVportCommentLikeCounts(commentIds) {
  const ids = Array.from(new Set((commentIds || []).filter(Boolean)));
  const map = new Map();
  if (ids.length === 0) return map;

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
  for (const id of ids) {
    if (!map.has(id)) map.set(id, 0);
  }
  return map;
}

export default {
  toggleVportCommentLike,
  isVportCommentLiked,
  getVportCommentLikeCounts,
};
