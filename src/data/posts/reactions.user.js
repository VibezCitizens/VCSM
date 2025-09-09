// src/data/posts/reactions.user.js
// Handles reactions on USER-authored posts.
// Unified-first: post_reactions_unified (actor_id)
// Fallback:      post_reactions_user / post_reactions_vport

import { supabase } from '@/lib/supabaseClient';

/* --------------------------------- helpers --------------------------------- */
const isSchemaCompatError = (e) => {
  const s = String(e?.code || e?.message || '').toLowerCase();
  // 42P01 undefined_table, 42703 undefined_column, 42P10 invalid_column_reference,
  // 23503 foreign_key_violation (e.g., actor FK), 0A000 not_supported
  return (
    s.includes('42p01') ||
    s.includes('42703') ||
    s.includes('42p10') ||
    s.includes('23503') ||
    s.includes('0a000')
  );
};

async function resolveActorId({ actingAsVport, userId, vportId }) {
  if (actingAsVport && vportId) {
    const { data, error } = await supabase.rpc('actor_id_for_vport', { v_id: vportId });
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.rpc('actor_id_for_user', { u_id: userId });
  if (error) throw error;
  return data;
}

function normalizeUnifiedRow(row) {
  const a = row.actors || row.actor || {};
  const isV = a.kind === 'vport';
  return {
    id: row.id,
    post_id: row.post_id,
    user_id: isV ? a.vport_id : a.profile_id, // keep legacy "user_id" meaning
    reaction: row.type,
    created_at: row.created_at,
    as_vport: isV,
    actor_vport_id: isV ? a.vport_id : null,
  };
}

/* ---------------------------------- SET ---------------------------------- */
/**
 * Insert or update a reaction for a USER post.
 * - If actingAsVport = true → record as that vport.
 * - Else → record as the user.
 */
export async function setForUserPost({ postId, kind, userId, actingAsVport, vportId }) {
  // Unified path first
  try {
    if (!postId || !kind || !userId) throw new Error('setForUserPost: postId, kind, userId required');
    const actorId = await resolveActorId({ actingAsVport, userId, vportId });

    // Clear any prior choice (keep single choice like/dislike)
    {
      const { error } = await supabase
        .from('post_reactions_unified')
        .delete()
        .eq('post_id', postId)
        .eq('actor_id', actorId)
        .in('type', ['like', 'dislike']);
      if (error) throw error;
    }

    // Upsert selected reaction
    const { error: upErr } = await supabase
      .from('post_reactions_unified')
      .upsert(
        { post_id: postId, actor_id: actorId, type: kind },
        { onConflict: 'post_id,actor_id,type' }
      );
    if (upErr) throw upErr;

    // Return a normalized row-like object
    return {
      id: null,
      post_id: postId,
      user_id: actingAsVport ? vportId : userId,
      reaction: kind,
      created_at: new Date().toISOString(),
      as_vport: !!actingAsVport,
      actor_vport_id: actingAsVport ? vportId : null,
    };
  } catch (e) {
    if (!isSchemaCompatError(e)) throw e;
    // Fallback: legacy tables
    if (actingAsVport && vportId) {
      const up = await supabase
        .from('post_reactions_vport')
        .update({ type: kind })
        .eq('post_id', postId)
        .eq('user_id', vportId)
        .select('*');
      if (up.error) throw up.error;
      if (up.data?.length) return {
        id: up.data[0].id,
        post_id: up.data[0].post_id,
        user_id: up.data[0].user_id,
        reaction: up.data[0].type,
        created_at: up.data[0].created_at,
        as_vport: true,
        actor_vport_id: up.data[0].user_id,
      };

      const ins = await supabase
        .from('post_reactions_vport')
        .insert([{ post_id: postId, user_id: vportId, type: kind }])
        .select('*')
        .single();
      if (ins.error) throw ins.error;
      return {
        id: ins.data.id,
        post_id: ins.data.post_id,
        user_id: ins.data.user_id,
        reaction: ins.data.type,
        created_at: ins.data.created_at,
        as_vport: true,
        actor_vport_id: ins.data.user_id,
      };
    }

    const up = await supabase
      .from('post_reactions_user')
      .update({ type: kind })
      .eq('post_id', postId)
      .eq('user_id', userId)
      .select('*');
    if (up.error) throw up.error;
    if (up.data?.length) return {
      id: up.data[0].id,
      post_id: up.data[0].post_id,
      user_id: up.data[0].user_id,
      reaction: up.data[0].type,
      created_at: up.data[0].created_at,
      as_vport: false,
      actor_vport_id: null,
    };

    const ins = await supabase
      .from('post_reactions_user')
      .insert([{ post_id: postId, user_id: userId, type: kind }])
      .select('*')
      .single();
    if (ins.error) throw ins.error;
    return {
      id: ins.data.id,
      post_id: ins.data.post_id,
      user_id: ins.data.user_id,
      reaction: ins.data.type,
      created_at: ins.data.created_at,
      as_vport: false,
      actor_vport_id: null,
    };
  }
}

/* ---------------------------------- LIST ---------------------------------- */
/**
 * List all reactions on a USER post, normalized into one array.
 */
export async function listForUserPost({ postId }) {
  // Unified path
  try {
    const { data, error } = await supabase
      .from('post_reactions_unified')
      .select(`
        id,
        post_id,
        type,
        created_at,
        actors:actors!post_reactions_unified_actor_id_fkey (
          id,
          kind,
          profile_id,
          vport_id
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(normalizeUnifiedRow);
  } catch (e) {
    if (!isSchemaCompatError(e)) throw e;

    // Fallback: legacy tables
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
}

/* --------------------------------- CLEAR --------------------------------- */
/**
 * Clear the caller’s reaction on a USER post.
 */
export async function clearForUserPost({ postId, userId, actingAsVport, vportId }) {
  // Unified path
  try {
    if (!postId || !userId) throw new Error('clearForUserPost: postId,userId required');
    const actorId = await resolveActorId({ actingAsVport, userId, vportId });
    const { error } = await supabase
      .from('post_reactions_unified')
      .delete()
      .eq('post_id', postId)
      .eq('actor_id', actorId)
      .in('type', ['like', 'dislike']); // remove both to be safe
    if (error) throw error;
    return true;
  } catch (e) {
    if (!isSchemaCompatError(e)) throw e;

    // Fallback: legacy tables
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
}
