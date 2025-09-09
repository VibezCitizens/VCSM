/**
 * Notifications DAL (RPC-backed)
 * - Uses SECURITY DEFINER RPC `notify_user` to upsert deduped notifications
 * - Unifies VPORT-owner notifications into the same `notifications` table
 */

import { supabase } from '@/lib/supabaseClient';

/* ============================================================
 * helpers
 * ============================================================ */

const hasKeys = (obj) => !!obj && Object.keys(obj).length > 0;

async function rpcNotifyUser({
  recipientUserId,
  actorUserId,
  kind,
  objectType,
  objectId,
  linkPath,
  context = {},
}) {
  // All NOT NULL columns are enforced here
  const payload = {
    p_user_id: recipientUserId,
    p_actor_id: actorUserId,
    p_kind: kind,
    p_object_type: objectType || 'unknown',
    p_object_id: objectId,                  // required
    p_link_path: linkPath || '/',           // required
    p_context: hasKeys(context) ? context : {}, // jsonb
  };

  const { error } = await supabase.rpc('notify_user', payload);
  if (error) throw error;
  return true;
}

/** Insert into `notifications` via RPC. */
async function insertUserNotification({
  recipientUserId,
  actorUserId,
  kind,           // e.g., 'post_like' | 'post_dislike' | 'post_reported' | 'story_reaction' | 'follow'
  objectType,     // e.g., 'post' | 'story' | 'user' | 'vport_post' | 'vport_story'
  objectId,       // UUID
  linkPath,       // string (NOT NULL)
  context = {},   // JSON payload
}) {
  return rpcNotifyUser({
    recipientUserId,
    actorUserId,
    kind,
    objectType,
    objectId,
    linkPath,
    context,
  });
}

/** Insert ONE owner notification to the VPORT OWNER, using the *same* notifications table. */
async function insertVportOwnerNotification({
  vportId,
  actorUserId,
  kind,
  objectType,
  objectId,
  linkPath,
  context = {},
}) {
  // Resolve owner (created_by)
  const { data: vp, error: vErr } = await supabase
    .from('vports')
    .select('created_by')
    .eq('id', vportId)
    .maybeSingle();
  if (vErr || !vp?.created_by) return false;

  // Don’t notify yourself
  if (vp.created_by === actorUserId) return true;

  return rpcNotifyUser({
    recipientUserId: vp.created_by,
    actorUserId,
    kind,
    objectType,
    objectId,
    linkPath,
    context,
  });
}

/* ============================================================
 * High-level creators
 * ============================================================ */

export async function notifyStoryReaction({
  isVportStory,
  storyId,
  actorUserId,
  emoji,
}) {
  if (isVportStory) {
    const { data: s, error: sErr } = await supabase
      .from('vport_stories')
      .select('vport_id')
      .eq('id', storyId)
      .maybeSingle();
    if (sErr || !s?.vport_id) return false;

    return insertVportOwnerNotification({
      vportId: s.vport_id,
      actorUserId,
      kind: 'story_reaction',
      objectType: 'vport_story',
      objectId: storyId,
      linkPath: `/vport-stories/${storyId}`,
      context: { reaction_type: emoji },
    });
  }

  const { data: s, error: sErr } = await supabase
    .from('stories')
    .select('user_id')
    .eq('id', storyId)
    .maybeSingle();
  if (sErr || !s?.user_id) return false;
  if (s.user_id === actorUserId) return true;

  return insertUserNotification({
    recipientUserId: s.user_id,
    actorUserId,
    kind: 'story_reaction',
    objectType: 'story',
    objectId: storyId,
    linkPath: `/stories/${storyId}`,
    context: { reaction_type: emoji },
  });
}

/**
 * Generic post reaction that auto-routes to user vs VPORT owner.
 * - reactionType: 'like' | 'dislike' | 'laugh' | 'fire' | etc.
 *   → emits 'post_like', 'post_dislike', or 'post_reaction'
 */
export async function notifyPostReaction({
  postId,
  actorUserId,
  reactionType, // string
}) {
  const toKind =
    reactionType === 'like'
      ? 'post_like'
      : reactionType === 'dislike'
      ? 'post_dislike'
      : 'post_reaction';

  // Try user posts (including posts with vport_id)
  const u = await supabase
    .from('posts')
    .select('id, user_id, vport_id')
    .eq('id', postId)
    .maybeSingle();

  if (u.data && !u.error) {
    const row = u.data;

    // Post by VPORT but stored in posts table → notify VPORT owner
    if (row.vport_id) {
      return insertVportOwnerNotification({
        vportId: row.vport_id,
        actorUserId,
        kind: toKind,
        objectType: 'post',
        objectId: postId,
        linkPath: `/post/${postId}`,
        context: { reaction_type: reactionType },
      });
    }

    // Normal user post
    if (row.user_id && row.user_id !== actorUserId) {
      return insertUserNotification({
        recipientUserId: row.user_id,
        actorUserId,
        kind: toKind,
        objectType: 'post',
        objectId: postId,
        linkPath: `/post/${postId}`,
        context: { reaction_type: reactionType },
      });
    }
    return true;
  }

  // Fallback to vport_posts
  const v = await supabase
    .from('vport_posts')
    .select('id, vport_id')
    .eq('id', postId)
    .maybeSingle();

  if (v.data && !v.error && v.data.vport_id) {
    return insertVportOwnerNotification({
      vportId: v.data.vport_id,
      actorUserId,
      kind: toKind,
      objectType: 'vport_post',
      objectId: postId,
      linkPath: `/post/${postId}`,
      context: { reaction_type: reactionType },
    });
  }

  return false;
}

export const notifyPostLike = (args) =>
  notifyPostReaction({ ...args, reactionType: 'like' });

export const notifyPostDislike = (args) =>
  notifyPostReaction({ ...args, reactionType: 'dislike' });

/** Follow → notify the followee (if not self). */
export async function notifyFollow({ followerUserId, followeeUserId }) {
  if (!followeeUserId || followeeUserId === followerUserId) return true;

  return insertUserNotification({
    recipientUserId: followeeUserId,
    actorUserId: followerUserId,
    kind: 'follow',
    objectType: 'user',
    objectId: followeeUserId,
    linkPath: `/profile/${followeeUserId}`,
    context: {},
  });
}

/** Post reported → notify the owner (user or VPORT owner). */
export async function notifyPostReported({
  postId,
  reporterUserId,
  reason = null,
}) {
  const u = await supabase
    .from('posts')
    .select('id, user_id, vport_id')
    .eq('id', postId)
    .maybeSingle();

  if (u.data && !u.error) {
    const row = u.data;

    if (row.vport_id) {
      return insertVportOwnerNotification({
        vportId: row.vport_id,
        actorUserId: reporterUserId,
        kind: 'post_reported',
        objectType: 'post',
        objectId: postId,
        linkPath: `/post/${postId}`,
        context: { reason, reporter_id: reporterUserId },
      });
    }

    if (row.user_id && row.user_id !== reporterUserId) {
      return insertUserNotification({
        recipientUserId: row.user_id,
        actorUserId: reporterUserId,
        kind: 'post_reported',
        objectType: 'post',
        objectId: postId,
        linkPath: `/post/${postId}`,
        context: { reason, reporter_id: reporterUserId },
      });
    }
    return true;
  }

  // vport_posts fallback
  const v = await supabase
    .from('vport_posts')
    .select('id, vport_id')
    .eq('id', postId)
    .maybeSingle();

  if (v.data && !v.error && v.data.vport_id) {
    return insertVportOwnerNotification({
      vportId: v.data.vport_id,
      actorUserId: reporterUserId,
      kind: 'post_reported',
      objectType: 'vport_post',
      objectId: postId,
      linkPath: `/post/${postId}`,
      context: { reason, reporter_id: reporterUserId },
    });
  }

  return false;
}

/* ============================================================
 * Reads / mutations
 * ============================================================ */

export async function listForUser({ userId, limit = 50 }) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((r) => {
      const type = r.kind || r.type || 'unknown';

      const metadata = {
        ...(r.context || {}),
        reaction_type: r.context?.reaction_type ?? null,
        reason: r.context?.reason ?? null,

        // generic ids
        post_id: r.object_id ?? r.post_id ?? null,
        story_id: r.story_id ?? null,
        conversation_id: r.conversation_id ?? null,

        // actor aliases
        sender_id: r.actor_id ?? r.actor_user_id ?? null,
        reactor_id: r.actor_id ?? r.actor_user_id ?? null,
        liker_id: r.actor_id ?? r.actor_user_id ?? null,
        disliker_id: r.actor_id ?? r.actor_user_id ?? null,
        follower_id: r.follower_id ?? null,
        reporter_id: r.context?.reporter_id ?? r.actor_id ?? r.actor_user_id ?? null,
      };

      const read =
        (typeof r.is_read === 'boolean' ? r.is_read :
        (typeof r.read === 'boolean' ? r.read :
        Boolean(r.read_at)));

      // NEW: normalize 'seen' across schema variants
      const seen =
        (typeof r.is_seen === 'boolean' ? r.is_seen :
        (typeof r.seen === 'boolean' ? r.seen :
        Boolean(r.seen_at)));

      return {
        id: r.id,
        type,
        metadata,
        read,
        seen,                  // include normalized seen
        created_at: r.created_at,
        link_path: r.link_path ?? '/',
        actor_id: r.actor_id ?? r.actor_user_id ?? null,
      };
    });
  } catch (e) {
    // If the table doesn’t exist in this env, just return empty
    const s = String(e?.code || e?.message || '').toLowerCase();
    if (s.includes('42p01') || s.includes('does not exist')) return [];
    throw e;
  }
}

export async function markAsRead({ id, userId }) {
  // Try read_at timestamp first
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
    if (!error) return true;
    if (!String(error?.code || '').includes('42703')) throw error;
  } catch (e) {
    const c = String(e?.code || '');
    if (!c.includes('42703') && !c.includes('42P01')) throw e;
  }

  // Try is_read boolean
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId);
    if (!error) return true;
    if (!String(error?.code || '').includes('42703')) throw error;
  } catch (e) {
    const c = String(e?.code || '');
    if (!c.includes('42703') && !c.includes('42P01')) throw e;
  }

  // Fall back to read boolean
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  } catch (e) {
    const s = String(e?.code || e?.message || '').toLowerCase();
    if (s.includes('42p01') || s.includes('does not exist')) return false;
    throw e;
  }
}

export async function markAllSeen({ userId }) {
  const now = new Date().toISOString();

  // 1) Prefer timestamp if column exists; only where null
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ seen_at: now })
      .eq('user_id', userId)
      .is('seen_at', null);
    if (!error) return true;
    if (!String(error?.code || '').includes('42703')) throw error;
  } catch (e) {
    const c = String(e?.code || '');
    if (!c.includes('42703') && !c.includes('42P01')) throw e;
  }

  // 2) Fallback to boolean is_seen, covering NULL or false
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_seen: true })
      .eq('user_id', userId)
      .or('is_seen.is.null,is_seen.eq.false');
    if (!error) return true;
    if (!String(error?.code || '').includes('42703')) throw error;
  } catch (e) {
    const c = String(e?.code || '');
    if (!c.includes('42703') && !c.includes('42P01')) throw e;
  }

  // 3) Final fallback to legacy 'seen' boolean
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ seen: true })
      .eq('user_id', userId)
      .or('seen.is.null,seen.eq.false');
    if (error) throw error;
    return true;
  } catch (e) {
    const s = String(e?.code || e?.message || '').toLowerCase();
    if (s.includes('42p01') || s.includes('does not exist')) return false;
    throw e;
  }
}

/** NEW: bulk mark all read for this user (tolerant to schema variants). */
export async function markAllRead({ userId }) {
  const now = new Date().toISOString();

  // Prefer setting read_at (if present); also flip seen fields for badge clearing
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        read_at: now,
        is_seen: true,
        seen_at: now, // harmless if column absent; caught by 42703 path below
      })
      .eq('user_id', userId)
      .is('read_at', null); // only unread
    if (!error) return true;
    if (!String(error?.code || '').includes('42703')) throw error;
  } catch (e) {
    const c = String(e?.code || '');
    if (!c.includes('42703') && !c.includes('42P01')) throw e;
  }

  // Fallback to is_read boolean (and set is_seen)
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, is_seen: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (!error) return true;
    if (!String(error?.code || '').includes('42703')) throw error;
  } catch (e) {
    const c = String(e?.code || '');
    if (!c.includes('42703') && !c.includes('42P01')) throw e;
  }

  // Final fallback to legacy read boolean
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
    return true;
  } catch (e) {
    const s = String(e?.code || e?.message || '').toLowerCase();
    if (s.includes('42p01') || s.includes('does not exist')) return false;
    throw e;
  }
}

export async function remove({ id, userId }) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  } catch (e) {
    const s = String(e?.code || e?.message || '').toLowerCase();
    if (s.includes('42p01') || s.includes('does not exist')) return false;
    throw e;
  }
}

const notifications = {
  // creators
  notifyStoryReaction,
  notifyPostReaction,
  notifyPostLike,
  notifyPostDislike,
  notifyFollow,
  notifyPostReported,
  // reads/mutations
  listForUser,
  markAsRead,
  markAllSeen,
  markAllRead,
  remove,
};

export default notifications;
