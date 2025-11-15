// src/data/reactions/commentLikes.js
// Like/unlike a comment using the CURRENT ACTOR (user or vport), RLS-friendly.
// Server-side trigger on vc.comment_likes handles notifications.

import { supabase } from '@/lib/supabaseClient';
import { getCurrentActorId } from '@/lib/actors/actors';

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function withRetry(fn, { tries = 2, delay = 250 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('network') || msg.includes('fetch')) {
        lastErr = e;
        if (i < tries - 1) await sleep(delay * (i + 1));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

async function getCurrentProfileId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id ?? null;
}

export async function isCommentLiked({ commentId, actingAsVport = false, vportId = null }) {
  const userId = await getCurrentProfileId();
  if (!userId || !commentId) return false;

  const actorId = await getCurrentActorId({
    userId,
    activeVportId: actingAsVport ? vportId : null,
  });

  const { data, error } = await supabase
    .schema('vc')
    .from('comment_likes')
    .select('comment_id')
    .eq('comment_id', commentId)
    .eq('actor_id', actorId)
    .limit(1);
  if (error) throw error;

  return !!(data && data.length);
}

export async function likeComment({
  commentId,
  actingAsVport = false,
  vportId = null,
}) {
  const userId = await getCurrentProfileId();
  if (!userId) throw new Error('likeComment: not authenticated');
  if (!commentId) throw new Error('likeComment: commentId required');

  const actorId = await getCurrentActorId({
    userId,
    activeVportId: actingAsVport ? vportId : null,
  });
  if (!actorId) throw new Error('likeComment: no actor for current identity');

  console.debug('[commentLikes] like -> actor', { actorId, actingAsVport, vportId, userId, commentId });

  // Insert like with the RIGHT actor_id (RLS will check your policies)
  const inserted = await withRetry(async () => {
    const { data, error } = await supabase
      .schema('vc')
      .from('comment_likes')
      .insert({ comment_id: commentId, actor_id: actorId })
      .select('comment_id, actor_id, created_at')
      .maybeSingle();

    if (error) {
      // (comment_id, actor_id) PK duplicate → treat as no-op
      if (error.code === '23505' || (error.message || '').toLowerCase().includes('duplicate')) {
        console.debug('[commentLikes] already liked (noop)');
        return null;
      }
      throw error;
    }
    return data;
  });

  // No client-side notification insert here: DB trigger handles it.
  return inserted;
}

export async function unlikeComment({
  commentId,
  actingAsVport = false,
  vportId = null,
}) {
  const userId = await getCurrentProfileId();
  if (!userId) throw new Error('unlikeComment: not authenticated');
  if (!commentId) throw new Error('unlikeComment: commentId required');

  const actorId = await getCurrentActorId({
    userId,
    activeVportId: actingAsVport ? vportId : null,
  });
  if (!actorId) throw new Error('unlikeComment: no actor for current identity');

  console.debug('[commentLikes] unlike -> actor', { actorId, actingAsVport, vportId, userId, commentId });

  const { error } = await supabase
    .schema('vc')
    .from('comment_likes')
    .delete()
    .eq('comment_id', commentId)
    .eq('actor_id', actorId);

  if (error) throw error;
}
