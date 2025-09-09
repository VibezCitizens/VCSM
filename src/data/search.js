// src/data/search.js
import { supabase } from '@/lib/supabaseClient';

/* ---------------- helpers ---------------- */
const isUndefinedTable = (err) =>
  String(err?.code || err?.message || '').includes('42P01') ||
  String(err?.message || '').toLowerCase().includes('does not exist');

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

const toLikePat = (q = '') => {
  const cleaned = q.trim().replace(/[(),]/g, ' ').replace(/\s+/g, ' ').slice(0, 120);
  return cleaned ? `*${cleaned}*` : '*';
};

/* ---------------- API ---------------- */
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

/** ✅ NEW: VPORT search (no is_published filter) */
export async function searchVports(q, { limit = 20, minLength = 2 } = {}) {
  if (!q || q.trim().length < minLength) return [];
  const pat = toLikePat(q);

  const rows = await safe(
    () =>
      supabase
        .from('vports')
        .select('id, name, description, avatar_url')
        .or(`name.ilike.${pat},description.ilike.${pat}`)
        .order('created_at', { ascending: false })
        .limit(limit),
    { optional: true }
  );

  return rows.map((v) => ({
    type: 'vport',
    id: v.id,
    name: v.name,
    description: v.description,
    avatar_url: v.avatar_url,
  }));
}

export async function searchAll({ q, types = ['users', 'vports', 'posts', 'videos', 'groups'] } = {}) {
  const tasks = [];
  if (types.includes('users')) tasks.push(searchUsers(q));
  if (types.includes('vports')) tasks.push(searchVports(q));
  if (types.includes('posts')) tasks.push(searchPosts(q));
  if (types.includes('videos')) tasks.push(searchVideos(q));
  if (types.includes('groups')) tasks.push(searchGroups(q));

  const settled = await Promise.allSettled(tasks);
  return settled
    .filter((s) => s.status === 'fulfilled')
    .flatMap((s) => s.value || []);
}

/* Namespace export */
export const search = {
  users: searchUsers,
  posts: searchPosts,
  videos: searchVideos,
  groups: searchGroups,
  vports: searchVports, // ✅ make sure this is here
  all: searchAll,
};
