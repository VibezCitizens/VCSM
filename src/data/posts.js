// src/data/posts.js
/**
 * @file Posts DAL (Data Access Layer)
 * Owns all DB reads/writes related to user/vport posts, comments, reactions, and roses.
 * UI should import ONLY from data/ (e.g., `import { db } from '@/data/data'`).
 */
import { supabase } from '@/lib/supabaseClient';

/* =========================================================================================
 * POSTS: create / delete
 * =======================================================================================*/

/** Create a regular user post. */
export async function createUserPost({
  userId,
  title = null,
  text = '',
  media_url = '',
  media_type = 'text',
  tags = [],
  visibility = 'public',
  category = null,
}) {
  const { data, error } = await supabase
    .from('posts')
    .insert([
      {
        user_id: userId,
        title,
        text,
        tags,
        visibility,
        media_url,
        media_type,
        category,
      },
    ])
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/** Create a VPORT post. */
export async function createVportPost({
  vportId,
  createdBy,
  title = null,
  body = '',
  media_url = '',
  media_type = 'text',
}) {
  const { data, error } = await supabase
    .from('vport_posts')
    .insert([
      {
        vport_id: vportId,
        created_by: createdBy,
        title,
        body,
        media_url,
        media_type,
      },
    ])
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/** Soft-delete a user post (sets `deleted=true`). */
export async function softDeleteUserPost(postId) {
  const { error } = await supabase.from('posts').update({ deleted: true }).eq('id', postId);
  if (error) throw error;
  return true;
}

/** Hard-delete a VPORT post (row removal). */
export async function hardDeleteVportPost(postId) {
  const { error } = await supabase.from('vport_posts').delete().eq('id', postId);
  if (error) throw error;
  return true;
}

/* =========================================================================================
 * COMMENTS: list / create / edit / delete  (+ likes for user-post comments)
 * =======================================================================================*/

/**
 * List top-level comments for a post (author-type aware).
 * @param {{authorType:'user'|'vport', postId:string}} p
 */
export async function listTopLevel({ authorType, postId }) {
  if (authorType === 'user') {
    const res = await supabase
      .from('post_comments')
      .select(`
        id, content, created_at, user_id, parent_id, post_id, as_vport, actor_vport_id,
        profiles!post_comments_user_id_fkey ( id, display_name, username, photo_url ),
        vport:actor_vport_id ( id, name, avatar_url )
      `)
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });
    if (res.error) throw res.error;
    return res.data || [];
  }

  const res = await supabase
    .from('vport_post_comments')
    .select(`
      id, content, created_at, user_id, vport_post_id, as_vport, actor_vport_id,
      profiles!vport_post_comments_user_id_fkey ( id, display_name, username, photo_url ),
      vport:actor_vport_id ( id, name, avatar_url )
    `)
    .eq('vport_post_id', postId)
    .order('created_at', { ascending: true });
  if (res.error) throw res.error;
  return res.data || [];
}

/** List replies for a parent comment (user posts only). */
export async function listReplies(parentId) {
  const res = await supabase
    .from('post_comments')
    .select(`
      id, content, created_at, user_id, parent_id, post_id, as_vport, actor_vport_id,
      profiles(*),
      vport:actor_vport_id ( id, name, avatar_url )
    `)
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true });
  if (res.error) throw res.error;
  return res.data || [];
}

/**
 * Create a comment (top-level or reply).
 * For user posts use {authorType:'user', postId}; for VPORT posts use {authorType:'vport', vportPostId}.
 */
export async function create({
  authorType,
  postId,
  vportPostId,
  userId,
  content,
  asVport,
  actorVportId,
  parentId = null,
}) {
  if (authorType === 'user') {
    const res = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        parent_id: parentId,
        user_id: userId,
        content,
        as_vport: !!asVport,
        actor_vport_id: asVport ? actorVportId : null,
      })
      .select(`
        id, content, created_at, user_id, parent_id, post_id, as_vport, actor_vport_id,
        profiles(*),
        vport:actor_vport_id ( id, name, avatar_url )
      `)
      .single();
    if (res.error) throw res.error;
    return res.data;
  }

  const res = await supabase
    .from('vport_post_comments')
    .insert({
      vport_post_id: vportPostId,
      user_id: userId,
      content,
      as_vport: !!asVport,
      actor_vport_id: asVport ? actorVportId : null,
    })
    .select('id')
    .single();
  if (res.error) throw res.error;
  return res.data;
}

/** Update a comment’s content (scoped by user for RLS). */
export async function update({ authorType, id, userId, content }) {
  const table = authorType === 'user' ? 'post_comments' : 'vport_post_comments';
  const { error } = await supabase.from(table).update({ content }).eq('id', id).eq('user_id', userId);
  if (error) throw error;
  return true;
}

/** Delete a comment (scoped by user for RLS). */
export async function remove({ authorType, id, userId }) {
  const table = authorType === 'user' ? 'post_comments' : 'vport_post_comments';
  const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
  return true;
}

/* ---------- comment likes (user posts only) ---------- */

export async function getLikes({ commentId, viewerId }) {
  const countQ = await supabase
    .from('comment_likes')
    .select('id', { count: 'exact', head: true })
    .eq('comment_id', commentId);
  if (countQ.error) throw countQ.error;

  const likedQ = await supabase
    .from('comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', viewerId)
    .limit(1);
  if (likedQ.error) throw likedQ.error;

  return {
    count: countQ.count ?? 0,
    likedByViewer: (likedQ.data?.length ?? 0) > 0,
  };
}

export async function setLike({ commentId, userId, like }) {
  if (like) {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .limit(1);
    if (error) throw error;
    if (!data?.length) {
      const ins = await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId });
      if (ins.error) throw ins.error;
    }
    return true;
  }
  const del = await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId);
  if (del.error) throw del.error;
  return true;
}

/* =========================================================================================
 * REACTIONS (👍 / 👎) — “delete old → insert new”, always set user_id
 * - Works for both posts tables (user posts & vport posts)
 * - Toggle: same reaction removes it
 * - Switch: other reaction replaces previous
 * =======================================================================================*/

/** List reactions for a post. */
export async function listForPost({ authorType, postId }) {
  const table = authorType === 'user' ? 'post_reactions' : 'vport_post_reactions';
  const res = await supabase
    .from(table)
    .select('id, reaction, user_id, as_vport, actor_vport_id')
    .eq('post_id', postId);
  if (res.error) throw res.error;
  return res.data ?? [];
}

/**
 * Clear any existing reaction for this actor on this post (no insert).
 * Useful for explicit “unreact”.
 */
export async function clearForPost({ authorType, postId, userId, vportId = null, actingAsVport = false }) {
  const table = authorType === 'user' ? 'post_reactions' : 'vport_post_reactions';
  let q = supabase
    .from(table)
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('as_vport', !!actingAsVport);

  if (actingAsVport) q = q.eq('actor_vport_id', vportId);
  else q = q.is('actor_vport_id', null);

  const { error } = await q;
  if (error) throw error;
  return true;
}

/**
 * Set reaction for current actor.
 * @param {'user'|'vport'} authorType
 * @param {string} postId
 * @param {'like'|'dislike'} kind
 * @param {string} userId
 * @param {string|null} vportId
 * @param {boolean} actingAsVport
 */
export async function setForPost({
  authorType,
  postId,
  kind,
  userId,
  vportId = null,
  actingAsVport = false,
}) {
  if (!postId || !kind || !userId) throw new Error('Missing required params');

  const table = authorType === 'user' ? 'post_reactions' : 'vport_post_reactions';

  // 0) What do I already have for this actor?
  const existingQ = supabase
    .from(table)
    .select('id, reaction')
    .eq('post_id', postId)
    .eq('user_id', userId) // always set & match user_id
    .eq('as_vport', !!actingAsVport);

  if (actingAsVport) {
    if (!vportId) throw new Error('vportId required when actingAsVport=true');
    existingQ.eq('actor_vport_id', vportId);
  } else {
    existingQ.is('actor_vport_id', null);
  }

  const existing = await existingQ.limit(1);
  if (existing.error) throw existing.error;

  const row = existing.data?.[0];

  // 1) Toggle off if same reaction exists
  if (row && row.reaction === kind) {
    const del = await supabase.from(table).delete().eq('id', row.id);
    if (del.error) throw del.error;
    return true;
  }

  // 2) Delete any previous reaction from this actor on this post
  let delAny = supabase
    .from(table)
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('as_vport', !!actingAsVport);

  if (actingAsVport) delAny = delAny.eq('actor_vport_id', vportId);
  else delAny = delAny.is('actor_vport_id', null);

  const delRes = await delAny;
  if (delRes.error) throw delRes.error;

  // 3) Insert the new reaction
  const insertPayload = {
    post_id: postId,
    user_id: userId,               // ALWAYS set
    reaction: kind,
    type: kind,                    // optional mirror
    as_vport: !!actingAsVport,
    actor_vport_id: actingAsVport ? vportId : null,
  };

  const ins = await supabase.from(table).insert(insertPayload);
  if (ins.error) throw ins.error;

  return true;
}

/* =========================================================================================
 * ROSES (user posts only) — unlimited
 * =======================================================================================*/

export async function count(postId) {
  const res = await supabase
    .from('roses_ledger')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId);
  if (res.error) throw res.error;
  return res.count ?? 0;
}

export async function give({ postId, fromUserId, qty = 1 }) {
  const res = await supabase
    .from('roses_ledger')
    .insert({ post_id: postId, from_user_id: fromUserId, qty });
  if (res.error) throw res.error;
  return true;
}

/* =========================================================================================
 * STRUCTURED EXPORT
 * =======================================================================================*/

export const comments = {
  listTopLevel,
  listReplies,
  create,
  update,
  remove,
  likes: { get: getLikes, set: setLike },
};

export const reactions = {
  listForPost,
  clearForPost,   // ← NEW
  setForPost,
};

export const roses = {
  count,
  give,
};

export const posts = {
  createUserPost,
  createVportPost,
  softDeleteUserPost,
  hardDeleteVportPost,
  comments,
  reactions,
  roses,
};

export default posts;
