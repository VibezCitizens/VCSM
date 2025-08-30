// src/data/notifications.js
/**
 * Notifications DAL
 * - Normalizes writes for both "user notifications" and "VPORT notifications"
 * - Tolerates column differences (type vs kind, read vs read_at, etc.)
 *
 * Tables we *may* have (code is tolerant if some are missing):
 *   notifications
 *   vport_notifications
 *   vport_managers(vport_id, manager_user_id)
 */

import { supabase } from '@/lib/supabaseClient';

/* ============================================================
 * helpers
 * ============================================================ */

const isUndefinedTable = (e) =>
  String(e?.code || e?.message || '').includes('42P01') ||
  String(e?.message || '').toLowerCase().includes('does not exist');

const isUndefinedColumn = (e) =>
  String(e?.code || e?.message || '').includes('42703') ||
  String(e?.message || '').toLowerCase().includes('column');

async function tryInsert(table, rowOrRows) {
  const { error } = await supabase.from(table).insert(rowOrRows);
  if (error) throw error;
  return true;
}

/** Insert into `notifications`, gracefully handling schema variants. */
async function insertUserNotification({
  table = 'notifications',
  recipientUserId,
  actorUserId,
  kind,           // e.g., 'story_reaction'
  objectType,     // e.g., 'story' | 'post' | 'vport_story'
  objectId,       // target object ID
  linkPath,       // optional deep-link
  context = {},   // JSON payload
}) {
  try {
    // Preferred (extended) schema
    await tryInsert(table, {
      user_id: recipientUserId,
      actor_id: actorUserId,
      kind,
      object_type: objectType ?? null,
      object_id: objectId ?? null,
      link_path: linkPath ?? null,
      context: Object.keys(context || {}).length ? context : null,
    });
    return true;
  } catch (e) {
    if (isUndefinedTable(e)) return false;
    if (!isUndefinedColumn(e)) throw e;

    // Fallback (basic) schema
    await tryInsert(table, {
      user_id: recipientUserId,
      actor_id: actorUserId,
      type: kind,             // map 'kind' -> 'type'
      post_id: objectId ?? null,
    });
    return true;
  }
}

/** Notify all managers in `vport_notifications`; silent no-op if tables missing. */
async function insertVportManagerNotifications({
  vportId,
  actorUserId,
  kind,
  objectType,
  objectId,
  linkPath,
  context = {},
}) {
  try {
    const { data: managers, error: mErr } = await supabase
      .from('vport_managers')
      .select('manager_user_id')
      .eq('vport_id', vportId);

    if (mErr) {
      if (isUndefinedTable(mErr)) return false;
      throw mErr;
    }
    if (!managers?.length) return false;

    // Try extended schema first
    try {
      const rows = managers.map((m) => ({
        recipient_user_id: m.manager_user_id,
        vport_id: vportId,
        actor_id: actorUserId,
        kind,
        object_type: objectType ?? null,
        object_id: objectId ?? null,
        link_path: linkPath ?? null,
        context: Object.keys(context || {}).length ? context : null,
      }));
      await tryInsert('vport_notifications', rows);
      return true;
    } catch (e) {
      if (!isUndefinedColumn(e)) {
        if (isUndefinedTable(e)) return false;
        throw e;
      }
      // Basic fallback
      const rows = managers.map((m) => ({
        recipient_user_id: m.manager_user_id,
        vport_id: vportId,
        actor_id: actorUserId,
        type: kind,
        post_id: objectId ?? null,
      }));
      await tryInsert('vport_notifications', rows);
      return true;
    }
  } catch (e) {
    if (isUndefinedTable(e)) return false;
    throw e;
  }
}

/* ============================================================
 * Public API
 * ============================================================ */

/**
 * High-level story reaction notifier:
 * - user story → 1 row in `notifications` to the story owner
 * - vport story → 1 row per manager in `vport_notifications`
 */
export async function notifyStoryReaction({
  isVportStory,
  storyId,
  actorUserId,
  emoji,
}) {
  try {
    if (isVportStory) {
      const { data: s, error: sErr } = await supabase
        .from('vport_stories')
        .select('vport_id')
        .eq('id', storyId)
        .maybeSingle();
      if (sErr || !s?.vport_id) return false;

      return insertVportManagerNotifications({
        vportId: s.vport_id,
        actorUserId,
        kind: 'story_reaction',
        objectType: 'vport_story',
        objectId: storyId,
        linkPath: `/vport-stories/${storyId}`,
        context: { emoji },
      });
    }

    // user story → notify owner
    const { data: s, error: sErr } = await supabase
      .from('stories')
      .select('user_id')
      .eq('id', storyId)
      .maybeSingle();
    if (sErr || !s?.user_id) return false;
    if (s.user_id === actorUserId) return true; // don't notify yourself

    return insertUserNotification({
      recipientUserId: s.user_id,
      actorUserId,
      kind: 'story_reaction',
      objectType: 'story',
      objectId: storyId,
      linkPath: `/stories/${storyId}`,
      context: { emoji },
    });
  } catch (e) {
    if (isUndefinedTable(e)) return false;
    throw e;
  }
}

/**
 * List latest notifications for a user.
 * Uses `select('*')` and normalizes the shape for the UI.
 */
export async function listForUser({ userId, limit = 50 }) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*') // tolerant of schema differences
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((r) => {
      const type = r.kind || r.type || 'unknown';
      const metadata = {
        ...(r.context || {}),
        // common fields your UI looks for:
        post_id: r.object_id ?? r.post_id ?? null,
        story_id: r.story_id ?? null,
        conversation_id: r.conversation_id ?? null,
        sender_id: r.actor_id ?? r.sender_id ?? null,
        reactor_id: r.actor_id ?? r.reactor_id ?? null,
        follower_id: r.follower_id ?? null,
      };

      const read =
        (typeof r.is_read === 'boolean' ? r.is_read :
        (typeof r.read === 'boolean' ? r.read :
        Boolean(r.read_at)));

      return {
        id: r.id,
        type,
        metadata,
        read,
        created_at: r.created_at,
        link_path: r.link_path ?? null,
        actor_id: r.actor_id ?? null,
      };
    });
  } catch (e) {
    if (isUndefinedTable(e)) return [];
    throw e;
  }
}

/** Mark a single notification as read; tolerant of read/read_at/is_read columns. */
export async function markAsRead({ id, userId }) {
  // Try read_at timestamp first
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
    if (!error) return true;
    if (!isUndefinedColumn(error)) throw error;
  } catch (e) {
    if (!isUndefinedColumn(e) && !isUndefinedTable(e)) throw e;
  }

  // Try is_read boolean
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId);
    if (!error) return true;
    if (!isUndefinedColumn(error)) throw error;
  } catch (e) {
    if (!isUndefinedColumn(e) && !isUndefinedTable(e)) throw e;
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
    if (isUndefinedTable(e)) return false;
    throw e;
  }
}

/** Mark all as seen (best-effort; safe-noop if column missing). */
export async function markAllSeen({ userId }) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_seen: true })
      .eq('user_id', userId)
      .eq('is_seen', false);
    if (!error) return true;
    if (!isUndefinedColumn(error)) throw error;
    return false;
  } catch (e) {
    if (isUndefinedTable(e)) return false;
    throw e;
  }
}

/** Delete a notification (RLS-scoped). */
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
    if (isUndefinedTable(e)) return false;
    throw e;
  }
}

const notifications = {
  notifyStoryReaction,
  listForUser,
  markAsRead,
  markAllSeen,
  remove,
};

export default notifications;
