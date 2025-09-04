// Routes comments by post type. VPORT posts → vport_post_comments (vport_post_id).
import { supabase } from '@/lib/supabaseClient';

/* --------------------------------- helpers --------------------------------- */
const isUndefinedColumnOrConstraint = (e) => {
  const s = String(e?.code || e?.message || '').toLowerCase();
  // 42703 = undefined_column, 42P10 = invalid_column_reference (often ON CONFLICT target not backed by unique index)
  return s.includes('42703') || s.includes('42p10');
};

/* ------------------------------ List top-level ------------------------------ */
export async function listTopLevel({ authorType, postId }) {
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
// Only for user posts (threaded)
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
  vportPostId = null, // optional convenience in callers
  userId,
  content,
  asVport,
  actorVportId,
  parentId = null,
}) {
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
  if (!id || !userId) throw new Error('Missing id/userId for comment update');

  const isVport = authorType === 'vport';
  const table = isVport ? 'vport_post_comments' : 'post_comments';

  // If the comment was posted AS a VPORT, the editor must be acting as that SAME vport.
  let q = supabase.from(table).update({ content }).eq('id', id).eq('user_id', userId);
  q = actingAsVport && vportId ? q.eq('actor_vport_id', vportId) : q.is('actor_vport_id', null);

  const selectCols = isVport
    ? `
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
    `
    : `
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
    `;

  const { data, error } = await q.select(selectCols).maybeSingle();
  if (error) throw error;
  if (!data) return { id, content }; // no-op (auth condition failed)

  return isVport ? { ...data, post_id: data.vport_post_id } : data;
}

/* ---------------------------------- Remove ---------------------------------- */
export async function remove({
  authorType,
  id,
  userId,
  actingAsVport = false,
  vportId = null,
}) {
  const table = authorType === 'vport' ? 'vport_post_comments' : 'post_comments';

  let q = supabase.from(table).delete().eq('id', id).eq('user_id', userId);
  q = actingAsVport && vportId ? q.eq('actor_vport_id', vportId) : q.is('actor_vport_id', null);

  const { error } = await q;
  if (error) throw error;
  return true;
}

/* ---------------------------------- Likes ---------------------------------- */
export async function getLikes({ commentId, viewerId }) {
  // Efficient head-only queries: one for count, one to see if viewer liked.
  const [{ count, error: cErr }, { count: meCnt, error: mErr }] = await Promise.all([
    supabase.from('comment_likes').select('id', { head: true, count: 'exact' }).eq('comment_id', commentId),
    supabase
      .from('comment_likes')
      .select('id', { head: true, count: 'exact' })
      .eq('comment_id', commentId)
      .eq('user_id', viewerId),
  ]);

  if (cErr) throw cErr;
  if (mErr) throw mErr;

  return { count: count ?? 0, likedByViewer: (meCnt ?? 0) > 0 };
}

export async function setLike({ commentId, userId, like }) {
  if (like) {
    // Prefer UPSERT (if you added a unique index on (comment_id, user_id)).
    try {
      const { error } = await supabase
        .from('comment_likes')
        .upsert(
          { comment_id: commentId, user_id: userId },
          { onConflict: 'comment_id,user_id' }
        );
      if (error) throw error;
      return true;
    } catch (e) {
      // Fallback if there’s no unique constraint on (comment_id, user_id).
      if (!isUndefinedColumnOrConstraint(e)) throw e;
      // Manual "exists → insert"
      const { count, error: chkErr } = await supabase
        .from('comment_likes')
        .select('id', { head: true, count: 'exact' })
        .eq('comment_id', commentId)
        .eq('user_id', userId);
      if (chkErr) throw chkErr;
      if ((count ?? 0) === 0) {
        const { error: insErr } = await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: userId });
        if (insErr) throw insErr;
      }
      return true;
    }
  } else {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  }
}

// Optional alias to support resolvers that look for comments.likes.get/set
export const likes = { get: getLikes, set: setLike };
