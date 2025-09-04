// src/data/posts/reactions.vport.js

import { supabase } from '@/lib/supabaseClient';

/**
 * Upsert a reaction on a VPORT post.
 * If actorVportId is provided, we treat it as acting-as-vport; otherwise it's a plain user reaction.
 */
export async function setForVportPost({ postId, kind, userId, actorVportId }) {
  const as_vport = !!actorVportId;

  const { data, error } = await supabase
    .from('vport_post_reactions')
    .upsert(
      [{
        post_id: postId,
        user_id: userId,                // auth.uid()
        reaction: kind,                 // 'like' | 'dislike'
        as_vport,
        actor_vport_id: as_vport ? actorVportId : null,
        // ❌ actor_key removed (db generates this)
      }],
      { onConflict: 'post_id,user_id,actor_key' } // use the generated actor_key
    )
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * List all reactions for a VPORT post.
 */
export async function listForVportPost({ postId }) {
  const { data, error } = await supabase
    .from('vport_post_reactions')
    .select('id,post_id,user_id,reaction,created_at,as_vport,actor_vport_id')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Clear the caller’s reaction on a VPORT post.
 */
export async function clearForVportPost({ postId, userId, actorVportId }) {
  const as_vport = !!actorVportId;

  let q = supabase
    .from('vport_post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (as_vport) {
    q = q.eq('as_vport', true).eq('actor_vport_id', actorVportId);
  } else {
    q = q.eq('as_vport', false).is('actor_vport_id', null);
  }

  const { error } = await q;
  if (error) throw error;
  return true;
}
