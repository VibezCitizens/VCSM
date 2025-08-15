// File: src/lib/reactions.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Return fast counters + my reaction for a post.
 * Requires posts.like_count/dislike_count/rose_count triggers from the SQL I gave you.
 */
export async function fetchReactionState(postId) {
  const [{ data: post, error: e1 }, { data: me, error: e2 }] = await Promise.all([
    supabase.from('posts')
      .select('id, like_count, dislike_count, rose_count')
      .eq('id', postId)
      .single(),
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return { data: null, error: null };
      return supabase
        .from('post_reactions')
        .select('reaction')        // ✅ no `id`, no `type`
        .eq('post_id', postId)
        .eq('user_id', uid)
        .maybeSingle();
    })(),
  ]);

  if (e1) throw e1;
  if (e2) throw e2;

  return {
    likeCount: post?.like_count ?? 0,
    dislikeCount: post?.dislike_count ?? 0,
    roseCount: post?.rose_count ?? 0,
    myReaction: me?.reaction ?? null, // 'like' | 'dislike' | null
  };
}

/** Set my reaction; pass 'like' | 'dislike' | null (null removes my reaction) */
export async function setReaction(postId, nextReaction /* 'like'|'dislike'|null */) {
  const { error } = await supabase.rpc('set_post_reaction', {
    p_post_id: postId,
    p_reaction: nextReaction, // null clears
  });
  if (error) throw error;
}

/** Give N roses to a post (1..100 clamped server-side). Returns nothing. */
export async function giveRoses(postId, qty = 1) {
  const { error } = await supabase.rpc('give_roses_to_post', {
    p_post_id: postId,
    p_qty: qty,
  });
  if (error) throw error;
}

/** Subscribe to live counter bumps for a post; returns unsubscribe fn */
export function subscribePostCounters(postId, onPatch) {
  const channel = supabase.channel(`post-${postId}`);

  // likes/dislikes change on insert/update/delete in post_reactions
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${postId}` },
    async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('like_count, dislike_count')
        .eq('id', postId)
        .single();
      if (!error && data) onPatch({ likeCount: data.like_count, dislikeCount: data.dislike_count });
    }
  );

  // roses bump on insert to roses_ledger
  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'roses_ledger', filter: `post_id=eq.${postId}` },
    async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('rose_count')
        .eq('id', postId)
        .single();
      if (!error && data) onPatch({ roseCount: data.rose_count });
    }
  );

  channel.subscribe();
  return () => supabase.removeChannel(channel);
}
