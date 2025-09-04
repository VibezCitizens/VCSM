/**
 * Stories DAL (Data Access Layer)
 * Owns all DB reads/writes for:
 *  - User stories:        stories, story_view_events, story_views, story_reactions
 *  - VPORT stories:       vport_stories, vport_story_view_events, vport_story_views, vport_story_reactions
 *
 * Change schema? Update this file. UI calls go through db.stories.
 */
import { supabase } from '@/lib/supabaseClient';

/* =========================================================================================
 * utils
 * =======================================================================================*/
const nowISO = () => new Date().toISOString();

const isUndefinedTable = (err) => {
  const msg = String(err?.code || err?.message || '').toLowerCase();
  // 42P01 = undefined_table
  return msg.includes('42p01') || msg.includes('does not exist');
};

// catches typical PostgREST “schema cache” function-missing errors as well
const isUndefinedFunction = (err) => {
  const code = String(err?.code || '').toLowerCase();
  const msg  = String(err?.message || '').toLowerCase();
  // 42883 = undefined_function (postgres)
  return (
    code.includes('42883') ||
    msg.includes('does not exist') ||
    msg.includes('could not find the function') ||
    msg.includes('schema cache')
  );
};

/** Resolve table / RPC names by story kind */
function t(isVport) {
  return {
    stories:       isVport ? 'vport_stories'             : 'stories',
    viewEvents:    isVport ? 'vport_story_view_events'   : 'story_view_events',
    views:         isVport ? 'vport_story_views'         : 'story_views',
    reactions:     isVport ? 'vport_story_reactions'     : 'story_reactions',
    rpcInsertUniqueView: isVport
      ? 'insert_unique_vport_story_view'
      : 'insert_unique_story_view',
    notifications: isVport ? 'vport_notifications'       : 'notifications',
  };
}

/* =========================================================================================
 * CREATE
 * =======================================================================================*/
export async function createStory({
  isVport,
  userId,
  vportId,
  createdBy,
  mediaUrl,
  mediaType,
  caption = '',
}) {
  const tables = t(isVport);

  if (!mediaUrl) throw new Error('mediaUrl required');
  if (mediaType !== 'image' && mediaType !== 'video') {
    throw new Error('mediaType must be "image" or "video"');
  }

  if (isVport) {
    if (!vportId) throw new Error('vportId required for VPORT stories');
    const { data, error } = await supabase
      .from(tables.stories)
      .insert([{
        vport_id:   vportId,
        created_by: createdBy || null,
        media_url:  mediaUrl,
        media_type: mediaType,
        caption,
      }])
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  if (!userId) throw new Error('userId required for user stories');
  const { data, error } = await supabase
    .from(tables.stories)
    .insert([{
      user_id:    userId,
      media_url:  mediaUrl,
      media_type: mediaType,
      caption,
    }])
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export const createUserStory  = (p) => createStory({ isVport: false, ...p });
export const createVportStory = (p) => createStory({ isVport: true,  ...p });

/* =========================================================================================
 * LIST
 * =======================================================================================*/
export async function listStories({
  isVport,
  userId,
  vportId,
  includeExpired = false,
  includeDeleted = false,
  limit = 50,
}) {
  const tables = t(isVport);
  let q = supabase
    .from(tables.stories)
    .select(
      isVport
        ? 'id, vport_id, created_by, media_url, media_type, caption, created_at, expires_at, deleted, is_active'
        : 'id, user_id, media_url, media_type, caption, created_at, expires_at, deleted, is_active'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  q = isVport ? q.eq('vport_id', vportId) : q.eq('user_id', userId);
  if (!includeDeleted) q = q.eq('deleted', false);
  if (!includeExpired) q = q.gte('expires_at', nowISO());

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export const listUserStories  = (p) => listStories({ isVport: false, ...p });
export const listVportStories = (p) => listStories({ isVport: true,  ...p });

/* =========================================================================================
 * DELETE (soft)
 * =======================================================================================*/
export async function softDeleteStory({ isVport, id, userId, createdBy }) {
  const tables = t(isVport);
  if (isVport) {
    const { error } = await supabase
      .from(tables.stories)
      .update({ deleted: true })
      .eq('id', id)
      .eq('created_by', createdBy || null);
    if (error) throw error;
    return true;
  } else {
    const { error } = await supabase
      .from(tables.stories)
      .update({ deleted: true })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  }
}

export const softDeleteUserStory  = (p) => softDeleteStory({ isVport: false, ...p });
export const softDeleteVportStory = (p) => softDeleteStory({ isVport: true,  ...p });

/* =========================================================================================
 * VIEWS (RPC-first, then fallback)
 * =======================================================================================*/
export async function logStoryView({ isVport, storyId, userId }) {
  const tables = t(isVport);

  // 1) Prefer the RPC (it handles event insert + summary upsert server-side)
  try {
    const { error: rpcErr } = await supabase.rpc(
      tables.rpcInsertUniqueView,
      { uid: userId, sid: storyId },
    );
    if (!rpcErr) return true;                          // RPC succeeded → done
    if (!isUndefinedFunction(rpcErr)) throw rpcErr;    // other error → surface it
  } catch (e) {
    if (!isUndefinedFunction(e)) throw e;              // not a "missing function" error
  }

  // 2) Fallback (no RPC): event insert + manual upsert in summary table
  try {
    // event row (raw log)
    const ev = await supabase
      .from(tables.viewEvents)
      .insert({ story_id: storyId, user_id: userId });
    if (ev.error && !isUndefinedTable(ev.error)) throw ev.error;

    // upsert-ish counter
    const sel = await supabase
      .from(tables.views)
      .select('count')
      .eq('story_id', storyId)
      .eq('user_id', userId)
      .maybeSingle();

    // PGRST116 = result not found (maybeSingle)
    if (sel.error && !String(sel.error?.code || '').includes('PGRST116')) {
      throw sel.error;
    }

    if (sel.data) {
      const curr = Number(sel.data.count || 0);
      const upd = await supabase
        .from(tables.views)
        .update({ count: curr + 1, viewed_at: nowISO() })
        .eq('story_id', storyId)
        .eq('user_id', userId);
      if (upd.error) throw upd.error;
    } else {
      const ins = await supabase
        .from(tables.views)
        .insert({
          story_id: storyId,
          user_id:  userId,
          count:    1,
          viewed_at: nowISO(),
        });
      if (ins.error) throw ins.error;
    }
  } catch (e) {
    if (!isUndefinedTable(e)) throw e;
  }

  return true;
}

export const logUserStoryView  = (p) => logStoryView({ isVport: false, ...p });
export const logVportStoryView = (p) => logStoryView({ isVport: true,  ...p });

/* =========================================================================================
 * UNIQUE VIEWERS
 * =======================================================================================*/
export async function getUniqueViewerCount({ isVport, storyId }) {
  const { views } = t(isVport);
  const { count, error } = await supabase
    .from(views)
    .select('user_id', { count: 'exact', head: true })
    .eq('story_id', storyId);
  if (error) throw error;
  return count ?? 0;
}

export const getUserStoryUniqueViewers  = (id) => getUniqueViewerCount({ isVport: false, storyId: id });
export const getVportStoryUniqueViewers = (id) => getUniqueViewerCount({ isVport: true,  storyId: id });

/* =========================================================================================
 * REACTIONS
 * =======================================================================================*/
export async function setStoryReaction({ isVport, storyId, userId, emoji }) {
  const tables = t(isVport);

  const { data: existing, error: selErr } = await supabase
    .from(tables.reactions)
    .select('emoji')
    .eq('story_id', storyId)
    .eq('user_id', userId)
    .maybeSingle();
  // PGRST116 = no row; ignore
  if (selErr && !String(selErr?.code || '').includes('PGRST116')) throw selErr;

  // clear existing (if any)
  if (existing) {
    const { error: delErr } = await supabase
      .from(tables.reactions)
      .delete()
      .eq('story_id', storyId)
      .eq('user_id', userId);
    if (delErr) throw delErr;
  }

  // if same or null -> toggled off
  if (!emoji || existing?.emoji === emoji) return { toggledOff: true };

  const { error: insErr } = await supabase
    .from(tables.reactions)
    .insert({ story_id: storyId, user_id: userId, emoji });
  if (insErr) throw insErr;
  return { toggledOff: false };
}

export async function listStoryReactions({ isVport, storyId }) {
  const tables = t(isVport);
  const { data, error } = await supabase
    .from(tables.reactions)
    .select('user_id, emoji, created_at')
    .eq('story_id', storyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export const reactToUserStory            = (p) => setStoryReaction({ isVport: false, ...p });
export const reactToVportStory           = (p) => setStoryReaction({ isVport: true,  ...p });
export const listUserStoryReactions      = (id) => listStoryReactions({ isVport: false, storyId: id });
export const listVportStoryReactions     = (id) => listStoryReactions({ isVport: true,  storyId: id });

/* =========================================================================================
 * NOTIFICATIONS
 * =======================================================================================*/
export async function notifyStoryReaction({ isVport, storyId, actorUserId, emoji }) {
  const tables = t(isVport);

  try {
    if (isVport) {
      // 1) find vport_id from story
      const { data: storyRow, error: sErr } = await supabase
        .from(tables.stories)
        .select('vport_id')
        .eq('id', storyId)
        .maybeSingle();
      if (sErr || !storyRow?.vport_id) return;
      const vportId = storyRow.vport_id;

      // 2) find VPORT owner (created_by)
      const { data: vp, error: vErr } = await supabase
        .from('vports')
        .select('created_by')
        .eq('id', vportId)
        .maybeSingle();
      if (vErr || !vp?.created_by) return;

      // avoid notifying the actor themselves if they are owner
      if (vp.created_by === actorUserId) return;

      // 3) insert one vport_notification
      const { error: nErr } = await supabase.from(tables.notifications).insert({
        recipient_user_id: vp.created_by,
        vport_id:          vportId,
        actor_user_id:     actorUserId,
        kind:              'story_reaction',
        object_type:       'vport_story',
        object_id:         storyId,
        link_path:         `/vport-stories/${storyId}`,
        context:           { emoji },
      });
      if (nErr) throw nErr;
      return;
    }

    // user story → notify owner in notifications
    const { data: s, error: sErr } = await supabase
      .from(tables.stories)
      .select('user_id')
      .eq('id', storyId)
      .maybeSingle();
    if (sErr || !s?.user_id) return;
    if (s.user_id === actorUserId) return;

    const { error: nErr } = await supabase.from(tables.notifications).insert({
      user_id:    s.user_id,
      actor_id:   actorUserId,
      kind:       'story_reaction',
      object_type:'story',
      object_id:  storyId,
      link_path:  `/stories/${storyId}`,
      context:    { emoji },
    });
    if (nErr) throw nErr;
  } catch (e) {
    if (!isUndefinedTable(e)) throw e;
  }
}

/* =========================================================================================
 * AGGREGATED EXPORT
 * =======================================================================================*/
const stories = {
  // create
  createStory,
  createUserStory,
  createVportStory,

  // list
  listStories,
  listUserStories,
  listVportStories,

  // delete
  softDeleteStory,
  softDeleteUserStory,
  softDeleteVportStory,

  // views
  logStoryView,
  logUserStoryView,
  logVportStoryView,
  getUniqueViewerCount,
  getUserStoryUniqueViewers,
  getVportStoryUniqueViewers,

  // reactions
  setStoryReaction,
  reactToUserStory,
  reactToVportStory,
  listStoryReactions,
  listUserStoryReactions,
  listVportStoryReactions,

  // notifications
  notifyStoryReaction,
};

export default stories;
