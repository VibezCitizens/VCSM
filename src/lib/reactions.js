// File: src/lib/reactions.js
// Helpers for post like/dislike + multi-rose tipping,
// aligned with the new schema:
// - post_reactions(post_id, user_id, reaction 'like'|'dislike')
// - roses_ledger(id, post_id, from_user_id, qty)
// And denormalized counters on posts: like_count, dislike_count, rose_count

import { supabase } from '@/lib/supabaseClient';

/* ------------------------------- internals -------------------------------- */

async function getUserId() {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

/* --------------------------------- reads ---------------------------------- */

/**
 * Fetch fast counters from posts + the current viewer's reaction (if logged in).
 * Returns: { likeCount, dislikeCount, roseCount, myReaction }
 */
export async function fetchReactionState(postId) {
  const uid = await getUserId();

  const [{ data: post, error: e1 }, me] = await Promise.all([
    supabase
      .from('posts')
      .select('id, like_count, dislike_count, rose_count')
      .eq('id', postId)
      .single(),
    uid
      ? supabase
          .from('post_reactions')
          .select('reaction')
          .eq('post_id', postId)
          .eq('user_id', uid)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (e1) throw e1;
  if (me.error) throw me.error;

  return {
    likeCount: post?.like_count ?? 0,
    dislikeCount: post?.dislike_count ?? 0,
    roseCount: post?.rose_count ?? 0,
    myReaction: me.data?.reaction ?? null, // 'like' | 'dislike' | null
  };
}

/* --------------------------------- writes --------------------------------- */

/**
 * Set or clear your reaction for a post.
 * nextReaction: 'like' | 'dislike' | null (null removes your reaction)
 * Uses RPC: set_post_reaction(p_post_id uuid, p_reaction reaction_type)
 */
export async function setReaction(postId, nextReaction /* 'like'|'dislike'|null */) {
  const { error } = await supabase.rpc('set_post_reaction', {
    p_post_id: postId,
    p_reaction: nextReaction, // null clears
  });
  if (error) throw error;
}

/**
 * Give N roses (1..100 clamped server-side) to a post.
 * Uses RPC: give_roses_to_post(p_post_id uuid, p_qty int)
 */
export async function giveRoses(postId, qty = 1) {
  const { error } = await supabase.rpc('give_roses_to_post', {
    p_post_id: postId,
    p_qty: qty,
  });
  if (error) throw error;
}

/* ------------------------------ realtime sync ----------------------------- */

/**
 * Subscribe to counter changes for a post.
 * onPatch receives partial updates, e.g. { likeCount?, dislikeCount?, roseCount? }
 * Returns: unsubscribe function.
 */
export function subscribePostCounters(postId, onPatch) {
  const channel = supabase.channel(`post-${postId}`);

  // Likes/dislikes: any change in post_reactions → triggers updated posts counters
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${postId}` },
    async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('like_count, dislike_count')
        .eq('id', postId)
        .single();
      if (!error && data) {
        onPatch?.({ likeCount: data.like_count, dislikeCount: data.dislike_count });
      }
    }
  );

  // Roses: new tips append to roses_ledger → triggers updated posts.rose_count
  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'roses_ledger', filter: `post_id=eq.${postId}` },
    async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('rose_count')
        .eq('id', postId)
        .single();
      if (!error && data) {
        onPatch?.({ roseCount: data.rose_count });
      }
    }
  );

  channel.subscribe();
  return () => supabase.removeChannel(channel);
}
