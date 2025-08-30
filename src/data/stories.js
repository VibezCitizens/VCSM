// src/data/stories.js
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

const isUndefinedTable = (err) =>
  String(err?.code || err?.message || '').includes('42P01') ||
  String(err?.message || '').toLowerCase().includes('does not exist');

const isUndefinedFunction = (err) =>
  String(err?.message || '').toLowerCase().includes('function') &&
  String(err?.message || '').toLowerCase().includes('does not exist');

/** Resolve table / RPC names by story kind */
function t(isVport) {
  return {
    stories: isVport ? 'vport_stories' : 'stories',
    viewEvents: isVport ? 'vport_story_view_events' : 'story_view_events',
    views: isVport ? 'vport_story_views' : 'story_views',
    reactions: isVport ? 'vport_story_reactions' : 'story_reactions',
    rpcInsertUniqueView: isVport
      ? 'insert_unique_vport_story_view'
      : 'insert_unique_story_view',
    notifications: isVport ? 'vport_notifications' : 'notifications',
    vportManagers: 'vport_managers',
  };
}

/* =========================================================================================
 * CREATE
 * =======================================================================================*/
/**
 * Create a story (image or video).
 * @param {{isVport:boolean,userId?:string,vportId?:string,createdBy?:string,mediaUrl:string,mediaType:'image'|'video',caption?:string}} p
 * @returns {Promise<string>} story id
 */
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
      .insert([{ vport_id: vportId, created_by: createdBy || null, media_url: mediaUrl, media_type: mediaType, caption }])
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  if (!userId) throw new Error('userId required for user stories');
  const { data, error } = await supabase
    .from(tables.stories)
    .insert([{ user_id: userId, media_url: mediaUrl, media_type: mediaType, caption }])
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/** Back-compat wrappers */
export const createUserStory = (p) => createStory({ isVport: false, ...p });
export const createVportStory = (p) => createStory({ isVport: true, ...p });

/* =========================================================================================
 * LIST
 * =======================================================================================*/
/**
 * List stories for a user or VPORT.
 * @param {{isVport:boolean,userId?:string,vportId?:string,includeExpired?:boolean,includeDeleted?:boolean,limit?:number}} p
 */
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

/** Back-compat wrappers */
export const listUserStories = (p) => listStories({ isVport: false, ...p });
export const listVportStories = (p) => listStories({ isVport: true, ...p });

/* =========================================================================================
 * DELETE (soft)
 * =======================================================================================*/
/**
 * Soft-delete a story (RLS-safe).
 * For VPORT stories we use created_by; adjust if your RLS uses vport ownership.
 */
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

/** Back-compat wrappers */
export const softDeleteUserStory = (p) => softDeleteStory({ isVport: false, ...p });
export const softDeleteVportStory = (p) => softDeleteStory({ isVport: true, ...p });

/* =========================================================================================
 * VIEWS (log view + unique viewer record)
 * =======================================================================================*/
/**
 * Log a view (event + unique viewer via RPC fallback).
 * @param {{isVport:boolean,storyId:string,userId:string}} p
 */
export async function logStoryView({ isVport, storyId, userId }) {
  const tables = t(isVport);

  // 1) fire-and-forget event
  try {
    const { error } = await supabase.from(tables.viewEvents).insert({ story_id: storyId, user_id: userId });
    if (error && !isUndefinedTable(error)) throw error;
  } catch (e) {
    if (!isUndefinedTable(e)) throw e;
  }

  // 2) RPC preferred
  try {
    const { error: rpcErr } = await supabase.rpc(tables.rpcInsertUniqueView, { uid: userId, sid: storyId });
    if (!rpcErr) return true;
    if (!isUndefinedFunction(rpcErr)) throw rpcErr;
  } catch (e) {
    if (!isUndefinedFunction(e)) throw e;
  }

  // 3) fallback manual "upsert-ish"
  try {
    const sel = await supabase
      .from(tables.views)
      .select('count')
      .eq('story_id', storyId)
      .eq('user_id', userId)
      .maybeSingle();

    if (sel.error && !String(sel.error?.code).includes('PGRST116')) throw sel.error;

    if (sel.data) {
      const curr = Number(sel.data.count || 0);
      const upd = await supabase
        .from(tables.views)
        .update({ count: curr + 1, viewed_at: nowISO() })
        .eq('story_id', storyId)
        .eq('user_id', userId);
      if (upd.error) throw upd.error;
    } else {
      const ins = await supabase.from(tables.views).insert({
        story_id: storyId,
        user_id: userId,
        count: 1,
        viewed_at: nowISO(),
      });
      if (ins.error) throw ins.error;
    }
  } catch (e) {
    if (!isUndefinedTable(e)) throw e;
  }

  return true;
}

/** Back-compat wrappers */
export const logUserStoryView = (p) => logStoryView({ isVport: false, ...p });
export const logVportStoryView = (p) => logStoryView({ isVport: true, ...p });

/** Get unique viewer count (rows in *views table). */
export async function getUniqueViewerCount({ isVport, storyId }) {
  const { views } = t(isVport);
  const { count, error } = await supabase
    .from(views)
    .select('user_id', { count: 'exact', head: true })
    .eq('story_id', storyId);
  if (error) throw error;
  return count ?? 0;
}

/** Back-compat wrappers */
export const getUserStoryUniqueViewers = (id) => getUniqueViewerCount({ isVport: false, storyId: id });
export const getVportStoryUniqueViewers = (id) => getUniqueViewerCount({ isVport: true, storyId: id });

/* =========================================================================================
 * REACTIONS (emoji)
 * =======================================================================================*/
/**
 * Toggle / set story reaction for a viewer.
 * - If the same emoji already exists -> remove (toggle off)
 * - Else replace any existing with new emoji
 * Pass `emoji=null` to just remove any existing reaction.
 * @param {{isVport:boolean,storyId:string,userId:string,emoji:string|null}} p
 */
export async function setStoryReaction({ isVport, storyId, userId, emoji }) {
  const tables = t(isVport);

  // get current (if any)
  const { data: existing, error: selErr } = await supabase
    .from(tables.reactions)
    .select('emoji')
    .eq('story_id', storyId)
    .eq('user_id', userId)
    .maybeSingle();
  if (selErr && !String(selErr?.code).includes('PGRST116')) throw selErr;

  // always clear existing
  if (existing) {
    const { error: delErr } = await supabase
      .from(tables.reactions)
      .delete()
      .eq('story_id', storyId)
      .eq('user_id', userId);
    if (delErr) throw delErr;
  }

  // if same or null -> done (toggled off)
  if (!emoji || existing?.emoji === emoji) return { toggledOff: true };

  // otherwise insert new
  const { error: insErr } = await supabase
    .from(tables.reactions)
    .insert({ story_id: storyId, user_id: userId, emoji });
  if (insErr) throw insErr;
  return { toggledOff: false };
}

/** List reactions for a story. */
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

/** Back-compat wrappers */
export const reactToUserStory = (p) => setStoryReaction({ isVport: false, ...p });
export const reactToVportStory = (p) => setStoryReaction({ isVport: true, ...p });
export const listUserStoryReactions = (id) => listStoryReactions({ isVport: false, storyId: id });
export const listVportStoryReactions = (id) => listStoryReactions({ isVport: true, storyId: id });

/* =========================================================================================
 * NOTIFICATIONS
 * =======================================================================================*/
/**
 * Notify the appropriate owner(s) about a reaction.
 * - user story → 1 row in `notifications`
 * - VPORT story → 1 row per manager in `vport_notifications`
 * Safe-noop if tables aren’t present.
 * @param {{isVport:boolean,storyId:string,actorUserId:string,emoji:string|null}} p
 */
export async function notifyStoryReaction({ isVport, storyId, actorUserId, emoji }) {
  const tables = t(isVport);

  try {
    if (isVport) {
      // find vport_id
      const { data: storyRow, error: sErr } = await supabase
        .from(tables.stories)
        .select('vport_id')
        .eq('id', storyId)
        .maybeSingle();
      if (sErr || !storyRow?.vport_id) return;
      const vportId = storyRow.vport_id;

      // find managers
      const { data: managers, error: mErr } = await supabase
        .from(tables.vportManagers)
        .select('manager_user_id')
        .eq('vport_id', vportId);
      if (mErr || !managers?.length) return;

      const rows = managers.map((m) => ({
        recipient_user_id: m.manager_user_id,
        vport_id: vportId,
        actor_id: actorUserId,
        kind: 'story_reaction',
        object_type: 'vport_story',
        object_id: storyId,
        link_path: `/vport-stories/${storyId}`,
        context: { emoji },
      }));

      const { error: nErr } = await supabase.from(tables.notifications).insert(rows);
      if (nErr) throw nErr;
      return;
    }

    // user story
    const { data: s, error: sErr } = await supabase
      .from(tables.stories)
      .select('user_id')
      .eq('id', storyId)
      .maybeSingle();
    if (sErr || !s?.user_id) return;
    if (s.user_id === actorUserId) return;

    const { error: nErr } = await supabase.from(tables.notifications).insert({
      user_id: s.user_id,
      actor_id: actorUserId,
      kind: 'story_reaction',
      object_type: 'story',
      object_id: storyId,
      link_path: `/stories/${storyId}`,
      context: { emoji },
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
