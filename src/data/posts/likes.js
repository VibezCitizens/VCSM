// src/data/posts/likes.js
/**
 * Likes DAL for posts AND comments via unified actor model.
 * - Posts:   table public.post_reactions_unified (type='like')
 * - Comments:table public.comment_likes (actor_id)  // unified
 *
 * Flexible API (unchanged):
 *   getLikes({ postId })          -> number
 *   getLikes({ commentId })       -> number
 *   setLike({ userId, like, postId, actingAsVport?, vportId? })       -> boolean
 *   setLike({ userId, like, commentId, actingAsVport?, vportId? })    -> boolean
 *
 * Also exports specific helpers:
 *   getPostLikes(postId), setPostLike({ userId, postId, like, actingAsVport?, vportId? })
 *   getCommentLikes(commentId), setCommentLike({ userId, commentId, like, actingAsVport?, vportId? })
 */
import { supabase } from '@/lib/supabaseClient';
import { resolveActorId } from '@/lib/actors';

/* ----------------------------- Post likes ----------------------------- */

export async function getPostLikes(postId) {
  if (!postId) throw new Error('getPostLikes: postId is required');
  const { count, error } = await supabase
    .from('post_reactions_unified')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('type', 'like');
  if (error) throw error;
  return count ?? 0;
}

export async function setPostLike({ userId, postId, like, actingAsVport = false, vportId = null }) {
  if (!userId || !postId || typeof like !== 'boolean') {
    throw new Error('setPostLike: { userId, postId, like } required');
  }
  const actorId = await resolveActorId({ actingAsVport, profileId: userId, vportId });

  // Clear existing like first (idempotent)
  {
    const { error } = await supabase
      .from('post_reactions_unified')
      .delete()
      .eq('post_id', postId)
      .eq('actor_id', actorId)
      .eq('type', 'like');
    if (error) throw error;
  }

  if (!like) return true;

  const { error: insErr } = await supabase
    .from('post_reactions_unified')
    .insert([{ post_id: postId, actor_id: actorId, type: 'like' }]);
  if (insErr) throw insErr;

  return true;
}

/* --------------------------- Comment likes ---------------------------- */

export async function getCommentLikes(commentId) {
  if (!commentId) throw new Error('getCommentLikes: commentId is required');
  const { count, error } = await supabase
    .from('comment_likes')
    .select('id', { count: 'exact', head: true })
    .eq('comment_id', commentId);
  if (error) throw error;
  return count ?? 0;
}

export async function setCommentLike({ userId, commentId, like, actingAsVport = false, vportId = null }) {
  if (!userId || !commentId || typeof like !== 'boolean') {
    throw new Error('setCommentLike: { userId, commentId, like } required');
  }

  const actorId = await resolveActorId({ actingAsVport, profileId: userId, vportId });

  // Clear existing like (if any) for this actor
  {
    const { error: delErr } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('actor_id', actorId);
    if (delErr) throw delErr;
  }

  if (!like) return true;

  const { error: insErr } = await supabase
    .from('comment_likes')
    .insert([{ comment_id: commentId, actor_id: actorId }]);
  if (insErr) throw insErr;

  return true;
}

/* ------------------------- Flexible façade --------------------------- */

export async function getLikes(arg) {
  if (typeof arg === 'string') return getPostLikes(arg);
  if (!arg || typeof arg !== 'object') {
    throw new Error('getLikes: pass { postId } or { commentId }');
  }
  const { postId, commentId } = arg;
  if (postId) return getPostLikes(postId);
  if (commentId) return getCommentLikes(commentId);
  throw new Error('getLikes: { postId } or { commentId } is required');
}

export async function setLike({ userId, like, postId, commentId, actingAsVport = false, vportId = null }) {
  if (postId) return setPostLike({ userId, postId, like, actingAsVport, vportId });
  if (commentId) return setCommentLike({ userId, commentId, like, actingAsVport, vportId });
  throw new Error('setLike: provide { postId } or { commentId }');
}

/* ------------------------------ Default ------------------------------ */
export default {
  getLikes,
  setLike,
  comments: { getLikes, setLike },
  getPostLikes,
  setPostLike,
  getCommentLikes,
  setCommentLike,
};
