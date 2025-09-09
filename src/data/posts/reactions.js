// src/data/posts/reactions.js
// Router over unified actor-based reactions first; fallback to legacy routers.

import { supabase } from '@/lib/supabaseClient';

import {
  setForUserPost as legacySetUser,
  listForUserPost as legacyListUser,
  clearForUserPost as legacyClearUser,
} from './reactions.user';

import {
  setForVportPost as legacySetVport,
  listForVportPost as legacyListVport,
  clearForVportPost as legacyClearVport,
} from './reactions.vport';

/* --------------------------------- helpers --------------------------------- */
const isSchemaCompatError = (e) => {
  const s = String(e?.code || e?.message || '').toLowerCase();
  // 42P01: undefined_table, 42703: undefined_column, 42P10: invalid_column_reference
  // 23503: foreign_key_violation (e.g., actor FK not present yet), 0A000: not_supported
  return (
    s.includes('42p01') ||
    s.includes('42703') ||
    s.includes('42p10') ||
    s.includes('23503') ||
    s.includes('0a000')
  );
};

// Resolve the correct actor_id based on context (user vs vport).
async function resolveActorId({ actingAsVport, userId, vportId }) {
  if (actingAsVport) {
    // Acting as a VPORT (either on user posts or vport posts)
    const { data, error } = await supabase.rpc('actor_id_for_vport', { v_id: vportId });
    if (error) throw error;
    return data;
  }
  // Acting as a normal user
  const { data, error } = await supabase.rpc('actor_id_for_user', { u_id: userId });
  if (error) throw error;
  return data;
}

// Normalize unified rows to what PostCard expects, plus a 'reaction' alias:
// { id, post_id, actor_id, user_id, type, reaction, created_at, as_vport, actor_vport_id }
function normalizeUnifiedRow(row) {
  const a = row.actors || row.actor || {}; // safety
  const isV = a.kind === 'vport';
  return {
    id: row.id,
    post_id: row.post_id,
    actor_id: row.actor_id,
    user_id: isV ? a.vport_id : a.profile_id, // keep legacy "user_id" meaning (vport id when as_vport)
    type: row.type,             // for PostCard.jsx filters
    reaction: row.type,         // alias for other callers
    created_at: row.created_at,
    as_vport: isV,
    actor_vport_id: isV ? a.vport_id : null,
  };
}

/* =============================== Unified Path =============================== */
/**
 * Upsert a reaction for a post (user or vport) using unified table.
 * kind: 'like' | 'dislike'
 */
async function unifiedSetForPost({
  authorType, // 'user' | 'vport' (not actually needed for unified write)
  postId,
  kind,
  userId,
  actingAsVport = false,
  vportId = null,
}) {
  if (!postId || !kind || !userId) throw new Error('unified setForPost: postId, kind, userId required');

  const actorId = await resolveActorId({ actingAsVport, userId, vportId });

  // idempotent: clear prior opposite/duplicate first (we clear both like/dislike to keep single choice)
  const { error: delErr } = await supabase
    .from('post_reactions_unified')
    .delete()
    .eq('post_id', postId)
    .eq('actor_id', actorId)
    .in('type', ['like', 'dislike']);
  if (delErr) throw delErr;

  // Insert selected reaction
  const { error: upErr } = await supabase
    .from('post_reactions_unified')
    .upsert(
      { post_id: postId, actor_id: actorId, type: kind },
      { onConflict: 'post_id,actor_id,type' }
    );
  if (upErr) throw upErr;

  return true;
}

/**
 * List reactions for a post, normalized.
 */
async function unifiedListForPost({ postId }) {
  if (!postId) throw new Error('unified listForPost: postId required');

  // Pull actor join to know whether it’s a vport or user
  const { data, error } = await supabase
    .from('post_reactions_unified')
    .select(
      `
      actor_id,
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
    `
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeUnifiedRow);
}

/**
 * Clear the caller's reaction(s) on a post (both like/dislike).
 */
async function unifiedClearForPost({ postId, userId, actingAsVport = false, vportId = null }) {
  if (!postId || !userId) throw new Error('unified clearForPost: postId,userId required');
  const actorId = await resolveActorId({ actingAsVport, userId, vportId });

  const { error } = await supabase
    .from('post_reactions_unified')
    .delete()
    .eq('post_id', postId)
    .eq('actor_id', actorId)
    .in('type', ['like', 'dislike']);

  if (error) throw error;
  return true;
}

/* ================================ Public API ================================ */
/**
 * Upsert a reaction for a post (user or vport).
 * Params:
 *   authorType: 'user' | 'vport'
 *   postId: string
 *   kind: 'like' | 'dislike'
 *   userId: string (auth user)
 *   actingAsVport?: boolean
 *   vportId?: string (when acting as vport on user posts, or actor on vport posts)
 */
export async function setForPost(args) {
  try {
    return await unifiedSetForPost(args);
  } catch (e) {
    if (!isSchemaCompatError(e)) throw e;
    // Fallback to legacy routers
    const { authorType, postId, kind, userId, actingAsVport = false, vportId = null } = args;
    if (authorType === 'vport') {
      return legacySetVport({
        postId,
        kind,
        userId,
        actorVportId: actingAsVport ? vportId : null,
      });
    }
    return legacySetUser({ postId, kind, userId, actingAsVport, vportId });
  }
}

/**
 * List reactions for a post, normalized to:
 *  { id, post_id, actor_id, user_id, type, reaction, created_at, as_vport, actor_vport_id }
 */
export async function listForPost({ authorType, postId }) {
  try {
    return await unifiedListForPost({ postId });
  } catch (e) {
    if (!isSchemaCompatError(e)) throw e;
    // Fallback
    return authorType === 'vport'
      ? legacyListVport({ postId })
      : legacyListUser({ postId });
  }
}

/**
 * Clear (remove) the caller’s reaction on a post.
 * For unified: delete both like/dislike for (post_id, actor_id).
 * For legacy: routed to the correct table based on authorType + actingAsVport.
 */
export async function clearForPost(args) {
  try {
    return await unifiedClearForPost(args);
  } catch (e) {
    if (!isSchemaCompatError(e)) throw e;
    // Fallback
    const { authorType, postId, userId, actingAsVport = false, vportId = null } = args;
    if (authorType === 'vport') {
      if (typeof legacyClearVport !== 'function') {
        throw new Error('clearForVportPost is not implemented');
      }
      return legacyClearVport({
        postId,
        userId,
        actorVportId: actingAsVport ? vportId : null,
      });
    }
    return legacyClearUser({ postId, userId, actingAsVport, vportId });
  }
}

/* Optional default export for extra compatibility */
export default {
  setForPost,
  listForPost,
  clearForPost,
};
