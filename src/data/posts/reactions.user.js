// src/data/posts/reactions.user.js
// Handles reactions on USER-authored posts.
// Two tables:
//   post_reactions_user   → reactions from regular users
//   post_reactions_vport  → reactions from vports (acting as a brand/port)

import { supabase } from '@/lib/supabaseClient';

/**
 * Insert or update a reaction for a USER post.
 * - If actingAsVport = true → record in post_reactions_vport (user_id = vportId).
 * - Else → record in post_reactions_user (user_id = userId).
 */
export async function setForUserPost({ postId, kind, userId, actingAsVport, vportId }) {
  if (actingAsVport && vportId) {
    // VPORT reacting on a USER post
    const up = await supabase
      .from('post_reactions_vport')
      .update({ type: kind })
      .eq('post_id', postId)
      .eq('user_id', vportId)
      .select('*');

    if (up.error) throw up.error;
    if (up.data?.length) return up.data[0];

    const ins = await supabase
      .from('post_reactions_vport')
      .insert([{ post_id: postId, user_id: vportId, type: kind }])
      .select('*')
      .single();

    if (ins.error) throw ins.error;
    return ins.data;
  }

  // Regular USER reacting on a USER post
  const up = await supabase
    .from('post_reactions_user')
    .update({ type: kind })
    .eq('post_id', postId)
    .eq('user_id', userId)
    .select('*');

  if (up.error) throw up.error;
  if (up.data?.length) return up.data[0];

  const ins = await supabase
    .from('post_reactions_user')
    .insert([{ post_id: postId, user_id: userId, type: kind }])
    .select('*')
    .single();

  if (ins.error) throw ins.error;
  return ins.data;
}

/**
 * List all reactions on a USER post, normalized into one array.
 */
export async function listForUserPost({ postId }) {
  const [ru, rv] = await Promise.all([
    supabase
      .from('post_reactions_user')
      .select('id,post_id,user_id,type,created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true }),

    supabase
      .from('post_reactions_vport')
      .select('id,post_id,user_id,type,created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true }),
  ]);

  if (ru.error) throw ru.error;
  if (rv.error) throw rv.error;

  const users = (ru.data ?? []).map(r => ({
    id: r.id,
    post_id: r.post_id,
    user_id: r.user_id,
    reaction: r.type,
    created_at: r.created_at,
    as_vport: false,
    actor_vport_id: null,
  }));

  const vports = (rv.data ?? []).map(r => ({
    id: r.id,
    post_id: r.post_id,
    user_id: r.user_id,
    reaction: r.type,
    created_at: r.created_at,
    as_vport: true,
    actor_vport_id: r.user_id,
  }));

  return [...users, ...vports].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );
}

/**
 * Clear the caller’s reaction on a USER post.
 */
export async function clearForUserPost({ postId, userId, actingAsVport, vportId }) {
  if (actingAsVport && vportId) {
    const del = await supabase
      .from('post_reactions_vport')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', vportId);

    if (del.error) throw del.error;
    return true;
  }

  const del = await supabase
    .from('post_reactions_user')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (del.error) throw del.error;
  return true;
}
