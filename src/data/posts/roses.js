// src/data/roses.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Insert-or-increment a rose for a post, per (post_id, actor_id).
 * Requires an owned actorId to satisfy RLS (owns_actor(actor_id)).
 *
 * NOTE: requires the DB migration that defines:
 *   create or replace function public.give_rose(p_post_id uuid, p_qty int, p_actor_id uuid) returns void ...
 */
export async function give({ postId, qty = 1, actorId }) {
  if (!postId) throw new Error('postId required');
  if (!actorId) throw new Error('actorId required (must be owned by current user)');

  const { error } = await supabase.rpc('give_rose', {
    p_post_id: postId,
    p_qty: qty,
    p_actor_id: actorId,
  });

  if (error) throw error;
  return true;
}

/**
 * Count roses for a post (sum of qty).
 * If you switched to append-only (one row per gift), this still works.
 */
export async function count(postId) {
  if (!postId) return 0;

  const { data, error } = await supabase
    .from('roses_ledger')
    .select('qty')
    .eq('post_id', postId);

  if (error) throw error;
  return (data ?? []).reduce((sum, r) => sum + (r?.qty ?? 0), 0);
}
