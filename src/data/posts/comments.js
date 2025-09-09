// Routes comments by post type. VPORT posts → vport_post_comments (vport_post_id).
import { supabase } from '@/lib/supabaseClient';
import { resolveActorId } from '@/lib/actors'; // ✅ actor helper (plural file name)

/**
 * This module:
 * - Lists/creates/updates/removes comments for user and VPORT posts.
 * - Supports ACTOR-based comment likes via comment_likes(actor_id, comment_id).
 * - Gracefully falls back to legacy user_id likes if your DB hasn't migrated yet.
 */

/* --------------------------------- helpers --------------------------------- */
const isUndefinedColumnOrConstraint = (e) => {
  const s = String(e?.code || e?.message || '').toLowerCase();
  // 42703 = undefined_column
  // 42P10 = invalid_column_reference (often ON CONFLICT target not backed by unique index)
  // 23503 = foreign_key_violation (wrong FK/path)
  return s.includes('42703') || s.includes('42p10') || s.includes('23503');
};

/* ------------------------------ List top-level ------------------------------ */
export async function listTopLevel({ authorType, postId }) {
  if (!postId) return [];

  if (authorType === 'vport') {
    const { data, error } = await supabase
      .from('vport_post_comments')
      .select(`
        id,
        vport_post_id,
        user_id,
        content,
        created_at,
        as_vport,
        actor_vport_id,
        parent_id,
        profiles:profiles!vport_post_comments_user_id_fkey (
          id,
          display_name,
          username,
          photo_url
        ),
        vport:vports!vport_post_comments_actor_vport_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('vport_post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Normalize so UI can rely on post_id; keep vport_post_id for reply path.
    return (data ?? []).map((r) => ({ ...r, post_id: r.vport_post_id }));
  }

  const { data, error } = await supabase
    .from('post_comments')
    .select(`
      id,
      post_id,
      user_id,
      content,
      created_at,
      as_vport,
      actor_vport_id,
      parent_id,
      profiles:profiles!post_comments_user_id_fkey (
        id,
        display_name,
        username,
        photo_url
      ),
      vport:vports!post_comments_actor_vport_id_fkey (
        id,
        name,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/* -------------------------------- List replies ------------------------------ */
/** Only for USER posts (threaded). */
export async function listReplies(parentId) {
  if (!parentId) return [];

  const { data, error } = await supabase
    .from('post_comments')
    .select(`
      id,
      post_id,
      user_id,
      content,
      created_at,
      as_vport,
      actor_vport_id,
      parent_id,
      profiles:profiles!post_comments_user_id_fkey (
        id,
        display_name,
        username,
        photo_url
      ),
      vport:vports!post_comments_actor_vport_id_fkey (
        id,
        name,
        avatar_url
      )
    `)
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/* ---------------------------------- Create ---------------------------------- */
export async function create({
  authorType,
  postId,
  vportPostId = null, // convenience for callers
  userId,
  content,
  asVport,
  actorVportId,
  parentId = null,
}) {
  if (!userId || !content) throw new Error('Missing userId/content');

  if (authorType === 'vport') {
    const targetId = vportPostId ?? postId;
    if (!targetId) throw new Error('Missing vportPostId/postId for vport comment.');

    const { data, error } = await supabase
      .from('vport_post_comments')
      .insert([
        {
          vport_post_id: targetId,      // FK → vport_posts.id
          user_id: userId,
          content,
          as_vport: !!asVport,
          actor_vport_id: asVport ? actorVportId ?? null : null,
          parent_id: null,              // not threaded per current UI
        },
      ])
      .select(`
        id,
        vport_post_id,
        user_id,
        content,
        created_at,
        as_vport,
        actor_vport_id,
        parent_id,
        profiles:profiles!vport_post_comments_user_id_fkey (
          id,
          display_name,
          username,
          photo_url
        ),
        vport:vports!vport_post_comments_actor_vport_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return { ...data, post_id: data.vport_post_id };
  }

  const { data, error } = await supabase
    .from('post_comments')
    .insert([
      {
        post_id: postId,                // FK → posts.id
        user_id: userId,
        content,
        as_vport: !!asVport,
        actor_vport_id: asVport ? actorVportId ?? null : null,
        parent_id: parentId ?? null,
      },
    ])
    .select(`
      id,
      post_id,
      user_id,
      content,
      created_at,
      as_vport,
      actor_vport_id,
      parent_id,
      profiles:profiles!post_comments_user_id_fkey (
        id,
        display_name,
        username,
        photo_url
      ),
      vport:vports!post_comments_actor_vport_id_fkey (
        id,
        name,
        avatar_url
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

/* ---------------------------------- Update ---------------------------------- */
export async function update({
  authorType,
  id,
  userId,
  content,
  actingAsVport = false,
  vportId = null,
}) {
  if (!id || !userId || !content) throw new Error('Missing id/userId/content for comment update');

  const isVportPost = authorType === 'vport';
  const table = isVportPost ? 'vport_post_comments' : 'post_comments';

  let q = supabase.from(table).update({ content }).eq('id', id);

  // If the comment was posted AS a VPORT, allow any manager acting as that SAME vport.
  if (actingAsVport && vportId) {
    q = q.eq('actor_vport_id', vportId);
  } else {
    // Normal user comment: the author (user_id) and NOT posted as vport
    q = q.eq('user_id', userId).is('actor_vport_id', null);
  }

  const selectCols = isVportPost
    ? `id,vport_post_id,user_id,content,created_at,as_vport,actor_vport_id,parent_id,
       profiles:profiles!vport_post_comments_user_id_fkey(id,display_name,username,photo_url),
       vport:vports!vport_post_comments_actor_vport_id_fkey(id,name,avatar_url)`
    : `id,post_id,user_id,content,created_at,as_vport,actor_vport_id,parent_id,
       profiles:profiles!post_comments_user_id_fkey(id,display_name,username,photo_url),
       vport:vports!post_comments_actor_vport_id_fkey(id,name,avatar_url)`;

  const { data, error } = await q.select(selectCols).maybeSingle();
  if (error) throw error;
  if (!data) return { id, content }; // auth condition failed/no-op

  return isVportPost ? { ...data, post_id: data.vport_post_id } : data;
}

/* ---------------------------------- Remove ---------------------------------- */
export async function remove({
  authorType,
  id,
  userId,
  actingAsVport = false,
  vportId = null,
}) {
  if (!id || !userId) throw new Error('Missing id/userId for delete');

  const table = authorType === 'vport' ? 'vport_post_comments' : 'post_comments';

  let q = supabase.from(table).delete().eq('id', id);

  if (actingAsVport && vportId) {
    q = q.eq('actor_vport_id', vportId);
  } else {
    q = q.eq('user_id', userId).is('actor_vport_id', null);
  }

  const { error } = await q;
  if (error) throw error;
  return true;
}

/* ---------------------------------- Likes ---------------------------------- */
/**
 * getLikes({ commentId, viewerId, actingAsVport?, vportId? })
 * - Resolves ACTOR id (user or vport) for viewer, then counts & checks membership.
 * - Falls back to legacy user_id if actor columns/unique index aren’t present.
 */
export async function getLikes({ commentId, viewerId, actingAsVport = false, vportId = null }) {
  if (!commentId) throw new Error('getLikes: commentId required');

  // total count (works in both schemas)
  const total = await supabase
    .from('comment_likes')
    .select('id', { head: true, count: 'exact' })
    .eq('comment_id', commentId);
  if (total.error) throw total.error;

  // If no viewer, we can’t compute likedByViewer
  if (!viewerId) return { count: total.count ?? 0, likedByViewer: false };

  try {
    const actorId = await resolveActorId({ profileId: viewerId, actingAsVport, vportId });

    const mine = await supabase
      .from('comment_likes')
      .select('id', { head: true, count: 'exact' })
      .eq('comment_id', commentId)
      .eq('actor_id', actorId);
    if (mine.error) throw mine.error;

    return { count: total.count ?? 0, likedByViewer: (mine.count ?? 0) > 0 };
  } catch (e) {
    // Legacy fallback (no actor_id/unique)
    if (!isUndefinedColumnOrConstraint(e)) throw e;

    const mineLegacy = await supabase
      .from('comment_likes')
      .select('id', { head: true, count: 'exact' })
      .eq('comment_id', commentId)
      .eq('user_id', viewerId);
    if (mineLegacy.error) throw mineLegacy.error;

    return { count: total.count ?? 0, likedByViewer: (mineLegacy.count ?? 0) > 0 };
  }
}

/**
 * setLike({ commentId, userId, like, actingAsVport?, vportId? })
 * - Prefers ACTOR upsert/delete on (comment_id, actor_id).
 * - Falls back to legacy user_id upsert/delete if needed.
 *
 * IMPORTANT: Callers don’t change. If you only support user-likes, just pass
 * userId and like. If you support “like as VPORT”, pass actingAsVport+vportId.
 */
export async function setLike({ commentId, userId, like, actingAsVport = false, vportId = null }) {
  if (!commentId || !userId) throw new Error('setLike: commentId,userId required');

  try {
    const actorId = await resolveActorId({ profileId: userId, actingAsVport, vportId });

    if (like) {
      const up = await supabase
        .from('comment_likes')
        .upsert({ comment_id: commentId, actor_id: actorId }, { onConflict: 'comment_id,actor_id' });
      if (up.error) throw up.error;
      return true;
    } else {
      const del = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('actor_id', actorId);
      if (del.error) throw del.error;
      return true;
    }
  } catch (e) {
    // Legacy fallback (no actor_id / unique index)
    if (!isUndefinedColumnOrConstraint(e)) throw e;

    if (like) {
      // Try legacy upsert; if the unique doesn’t exist, do exists→insert.
      try {
        const upLegacy = await supabase
          .from('comment_likes')
          .upsert({ comment_id: commentId, user_id: userId }, { onConflict: 'comment_id,user_id' });
        if (upLegacy.error) throw upLegacy.error;
        return true;
      } catch (e2) {
        if (!isUndefinedColumnOrConstraint(e2)) throw e2;
        const chk = await supabase
          .from('comment_likes')
          .select('id', { head: true, count: 'exact' })
          .eq('comment_id', commentId)
          .eq('user_id', userId);
        if (chk.error) throw chk.error;
        if ((chk.count ?? 0) === 0) {
          const ins = await supabase
            .from('comment_likes')
            .insert({ comment_id: commentId, user_id: userId });
          if (ins.error) throw ins.error;
        }
        return true;
      }
    } else {
      const delLegacy = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
      if (delLegacy.error) throw delLegacy.error;
      return true;
    }
  }
}

// Optional alias so callers can use db.comments.likes.get/set
export const likes = { get: getLikes, set: setLike };

export default {
  listTopLevel,
  listReplies,
  create,
  update,
  remove,
  likes,
};

