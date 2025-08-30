// src/data/search.js
/**
 * Centralized search DAL.
 * All search-related DB reads go through here so schema tweaks are localized.
 */
import { supabase } from '@/lib/supabaseClient';

/* ------------------------------- helpers -------------------------------- */

/** Detect "relation does not exist" (missing table) so we can fail softly. */
const isUndefinedTable = (err) =>
  String(err?.code || err?.message || '').includes('42P01') ||
  String(err?.message || '').toLowerCase().includes('does not exist');

/** Safe wrapper: returns [] on error. If `optional` and table is missing, also []. */
const safe = async (fn, { optional = false } = {}) => {
  try {
    const { data, error } = await fn();
    if (error) {
      if (optional && isUndefinedTable(error)) return [];
      console.warn('[search] error:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    if (optional && isUndefinedTable(e)) return [];
    console.warn('[search] exception:', e);
    return [];
  }
};

/**
 * Build a PostgREST `.or()` pattern for `ilike` safely.
 * - Strip commas/parentheses (they break `.or()` grammar).
 * - Collapse whitespace.
 * - Use `*term*` wildcard (PostgREST style).
 */
const toLikePat = (q = '') => {
  const cleaned = q
    .trim()
    .replace(/[(),]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 120); // keep it sane
  return cleaned ? `*${cleaned}*` : '*';
};

/* --------------------------------- API ---------------------------------- */

/**
 * Search user profiles by username/display_name.
 * @returns Array<{type:'user', id, username, display_name, photo_url}>
 */
export async function searchUsers(q, { limit = 20, minLength = 2 } = {}) {
  if (!q || q.trim().length < minLength) return [];
  const pat = toLikePat(q);

  const rows = await safe(() =>
    supabase
      .from('profiles')
      .select('id, username, display_name, photo_url')
      .or(`username.ilike.${pat},display_name.ilike.${pat}`)
      .limit(limit)
  );

  return rows.map((u) => ({
    type: 'user',
    id: u.id,
    username: u.username,
    display_name: u.display_name,
    photo_url: u.photo_url,
  }));
}

/**
 * Search posts (public, not deleted) by title/text.
 * @returns Array<{type:'post', id, user_id, title, text, media_url, media_type, created_at}>
 */
export async function searchPosts(q, { limit = 20, minLength = 2 } = {}) {
  if (!q || q.trim().length < minLength) return [];
  const pat = toLikePat(q);

  const rows = await safe(() =>
    supabase
      .from('posts')
      .select('id, user_id, title, text, media_url, media_type, created_at, visibility, deleted')
      .eq('visibility', 'public')
      .eq('deleted', false)
      .or(`title.ilike.${pat},text.ilike.${pat}`)
      .order('created_at', { ascending: false })
      .limit(limit)
  );

  return rows.map((p) => ({
    type: 'post',
    id: p.id,
    user_id: p.user_id,
    title: p.title,
    text: p.text,
    media_url: p.media_url,
    media_type: p.media_type,
    created_at: p.created_at,
  }));
}

/**
 * Search videos (subset of posts where media_type='video').
 * @returns Array<{type:'video', id, user_id, title, text, media_url, created_at}>
 */
export async function searchVideos(q, { limit = 20, minLength = 2 } = {}) {
  if (!q || q.trim().length < minLength) return [];
  const pat = toLikePat(q);

  const rows = await safe(() =>
    supabase
      .from('posts')
      .select('id, user_id, title, text, media_url, media_type, created_at, visibility, deleted')
      .eq('media_type', 'video')
      .eq('visibility', 'public')
      .eq('deleted', false)
      .or(`title.ilike.${pat},text.ilike.${pat}`)
      .order('created_at', { ascending: false })
      .limit(limit)
  );

  return rows.map((v) => ({
    type: 'video',
    id: v.id,
    user_id: v.user_id,
    title: v.title,
    text: v.text,
    media_url: v.media_url,
    created_at: v.created_at,
  }));
}

/**
 * Search groups by name/description.
 * Optional: returns [] if the `groups` table doesn't exist.
 * @returns Array<{type:'group', id, name, description}>
 */
export async function searchGroups(q, { limit = 20, minLength = 2 } = {}) {
  if (!q || q.trim().length < minLength) return [];
  const pat = toLikePat(q);

  const rows = await safe(
    () =>
      supabase
        .from('groups')
        .select('id, name, description, created_at')
        .or(`name.ilike.${pat},description.ilike.${pat}`)
        .order('created_at', { ascending: false })
        .limit(limit),
    { optional: true }
  );

  return rows.map((g) => ({
    type: 'group',
    id: g.id,
    name: g.name,
    description: g.description,
  }));
}

/**
 * Convenience: run multiple searches in parallel and flatten.
 * @param {{q: string, types?: Array<'users'|'posts'|'videos'|'groups'>}} params
 */
export async function searchAll({ q, types = ['users', 'posts', 'videos', 'groups'] } = {}) {
  const tasks = [];
  if (types.includes('users')) tasks.push(searchUsers(q));
  if (types.includes('posts')) tasks.push(searchPosts(q));
  if (types.includes('videos')) tasks.push(searchVideos(q));
  if (types.includes('groups')) tasks.push(searchGroups(q));

  const settled = await Promise.allSettled(tasks);
  return settled
    .filter((s) => s.status === 'fulfilled')
    .flatMap((s) => s.value || []);
}

/* Namespace export if you like `db.search.*` style */
export const search = {
  users: searchUsers,
  posts: searchPosts,
  videos: searchVideos,
  groups: searchGroups,
  all: searchAll,
};
