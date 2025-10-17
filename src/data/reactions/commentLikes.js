// src/data/reactions/commentLikes.js
// Like/unlike a comment using the CURRENT ACTOR (user or vport), RLS-friendly.
// If you already have a DB trigger for comment_like notifications, keep it;
// this module still sets the correct actor_id. Debug logs included.

import { supabase } from '@/lib/supabaseClient';
import { getCurrentActorId } from '@/lib/actors/actors';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function withRetry(fn, { tries = 2, delay = 250 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) {
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

// small helper to enrich notif context (optional)
async function getCommentMeta(commentId) {
  if (!commentId) return { post_id: null, preview: null };
  const { data, error } = await supabase
    .schema('vc')
    .from('post_comments')
    .select('post_id, content')
    .eq('id', commentId)
    .maybeSingle();
  if (error) throw error;
  return {
    post_id: data?.post_id ?? null,
    preview: (data?.content || '').slice(0, 100),
  };
}

// Who should receive a comment-like notif? The comment author (profile owner).
async function getCommentOwnerProfileId(commentId) {
  if (!commentId) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('post_comments')
    .select('actor_id')
    .eq('id', commentId)
    .maybeSingle();
  if (error) throw error;

  const actorId = data?.actor_id || null;
  if (!actorId) return null;

  const { data: actor, error: aErr } = await supabase
    .schema('vc')
    .from('actors')
    .select('profile_id, vport_id')
    .eq('id', actorId)
    .maybeSingle();
  if (aErr) throw aErr;

  return actor?.profile_id ?? null;
}

export async function isCommentLiked({ commentId }) {
  const meId = await getCurrentProfileId();
  if (!meId || !commentId) return false;

  const { data, error } = await supabase
    .schema('vc')
    .from('comment_likes')
    .select('comment_id')
    .eq('comment_id', commentId)
    .eq('user_id', meId) // narrows to my identity
    .limit(1);
  if (error) throw error;
  return !!(data && data.length);
}

export async function likeComment({
  commentId,
  actingAsVport = false,
  vportId = null, // pass when actingAsVport=true
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

  // Insert like with the RIGHT actor_id + user_id (for RLS).
  const ins = await withRetry(async () => {
    const { data, error } = await supabase
      .schema('vc')
      .from('comment_likes')
      .insert({ comment_id: commentId, actor_id: actorId, user_id: userId })
      .select('comment_id, actor_id, created_at')
      .maybeSingle();
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('duplicate') || msg.includes('unique')) {
        console.debug('[commentLikes] already liked (noop)');
        return null;
      }
      throw error;
    }
    return data;
  });

  // If you do NOT have a DB trigger creating the notif, you can enable the block below.
  // Otherwise, skip it to avoid duplicates.
  try {
    const receiverId = await getCommentOwnerProfileId(commentId);
    if (receiverId) {
      const { post_id, preview } = await getCommentMeta(commentId);
      const context = { comment_id: commentId, post_id, preview, action: 'like' };

      const { error: nErr } = await supabase
        .schema('vc')
        .from('notifications')
        .insert({
          user_id: receiverId,
          actor_id: actorId,                // ✅ critical: same actor -> view renders vport when applicable
          kind: 'comment_like',
          object_type: 'post_comment',
          object_id: commentId,
          link_path: post_id
            ? `/noti/post/${encodeURIComponent(post_id)}?commentId=${encodeURIComponent(commentId)}`
            : null,
          context,
        });

      if (nErr) {
        console.warn('[commentLikes] notif insert failed (ok if trigger exists):', nErr.message || nErr);
      } else {
        console.debug('[commentLikes] notif inserted', { receiverId, commentId, post_id });
      }
    } else {
      console.debug('[commentLikes] no receiver profile for commentId', commentId);
    }
  } catch (e) {
    console.warn('[commentLikes] notify block error:', e?.message || e);
  }

  return ins;
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
