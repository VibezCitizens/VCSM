// src/data/feed.js
/**
 * Unified Feed DAL
 * - Merges user posts (public.posts) and VPORT posts (public.vport_posts)
 * - Stable pagination by over-fetching from each source, then merge-sort + slice
 * - Author hydration caches (profiles, vports)
 * - Null-safe video filtering (keeps rows where media_type is NULL unless includeVideos=true)
 */

import { supabase } from '@/lib/supabaseClient';

/** Conservative: if profile unreadable due to RLS, assume NOT adult. */
export async function getViewerIsAdult(userId) {
  if (!userId) return false;
  const { data, error } = await supabase
    .from('profiles')
    .select('is_adult')
    .eq('id', userId)
    .maybeSingle();
  if (error) return false;
  return !!data?.is_adult;
}

/**
 * Fetch one unified page (user+vport), newest first.
 * @param {Object} p
 * @param {number} p.page
 * @param {number} p.pageSize
 * @param {boolean} p.viewerIsAdult
 * @param {boolean} [p.includeVideos=false]
 * @param {Record<string, any>} [p.userAuthorCache={}]
 * @param {Record<string, any>} [p.vportAuthorCache={}]
 */
export async function fetchPage({
  page = 0,
  pageSize = 10,
  viewerIsAdult = false, // reserved for future post-level gating
  includeVideos = false,
  userAuthorCache = {},
  vportAuthorCache = {},
}) {
  // Indices for the merged list
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // Over-fetch from each table so merging remains stable across pages
  // (take more than needed to absorb interleaving after merge-sort)
  const takeCount = Math.max(pageSize * 4, (page + 1) * pageSize * 2);

  /* ------------------------ USER POSTS ------------------------ */
  let userQ = supabase
    .from('posts')
    .select(
      [
        'id',
        'user_id',
        'vport_id', // may be null (normal user post) or present (cross-post)
        'title',
        'text',
        'media_url',
        'media_type',
        'post_type',
        'visibility',
        'deleted',
        'created_at',
      ].join(',')
    )
    .eq('deleted', false)
    .eq('visibility', 'public');

  // Null-safe video exclusion:
  // keep if media_type IS NULL OR media_type <> 'video'
  if (!includeVideos) {
    userQ = userQ
      .or('media_type.is.null,media_type.neq.video')
      .or('post_type.is.null,post_type.neq.video');
  }

  const userRes = await userQ.order('created_at', { ascending: false }).limit(takeCount);
  if (userRes.error) throw userRes.error;
  const userRows = userRes.data ?? [];

  /* ------------------------ VPORT POSTS ----------------------- */
  let vportQ = supabase
    .from('vport_posts')
    .select(
      [
        'id',
        'vport_id',
        'created_by',
        'title',
        'body',
        'media_url',
        'media_type',
        'created_at',
      ].join(',')
    );

  if (!includeVideos) {
    vportQ = vportQ.or('media_type.is.null,media_type.neq.video');
  }

  const vportRes = await vportQ.order('created_at', { ascending: false }).limit(takeCount);
  if (vportRes.error) throw vportRes.error;
  const vportRows = vportRes.data ?? [];

  /* ---------------------- NORMALIZE SHAPES -------------------- */
  const mappedUsers = userRows.map((p) => ({
    id: p.id,
    type: p.vport_id ? 'vport' : 'user', // if row is tied to vport_id, treat as vport authored
    authorId: p.vport_id ?? p.user_id,
    title: p.title ?? null,
    text: p.text ?? null,
    media_url: p.media_url ?? '',
    media_type: p.media_type ?? 'text',
    created_at: p.created_at,
    source: 'posts',
    raw: p,
  }));

  const mappedVports = vportRows.map((p) => ({
    id: p.id,
    type: 'vport',
    authorId: p.vport_id,
    title: p.title ?? null,
    text: p.body ?? '',
    media_url: p.media_url ?? '',
    media_type: p.media_type ?? 'text',
    created_at: p.created_at,
    source: 'vport_posts',
    raw: p,
  }));

  /* ---------------------- MERGE + SORT ------------------------ */
  const merged = [...mappedUsers, ...mappedVports].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  // (Optional) age gating — no post-level flag yet, so pass-through today
  const gated = merged;

  // Slice merged page
  const pageItems = gated.slice(from, to + 1);
  const nextHasMore = gated.length > to + 1;

  /* ---------------- AUTHOR HYDRATION (CACHED) ----------------- */
  const needUserIds = new Set();
  const needVportIds = new Set();

  for (const it of pageItems) {
    if (it.type === 'user') {
      if (it.authorId && !userAuthorCache[it.authorId]) needUserIds.add(it.authorId);
    } else {
      if (it.authorId && !vportAuthorCache[it.authorId]) needVportIds.add(it.authorId);
    }
  }

  const [profilesRes, vportsRes] = await Promise.all([
    needUserIds.size
      ? supabase
          .from('profiles')
          .select('id, display_name, username, photo_url, is_adult')
          .in('id', Array.from(needUserIds))
      : Promise.resolve({ data: [], error: null }),
    needVportIds.size
      ? supabase
          .from('vports')
          .select('id, name, avatar_url, type, verified')
          .in('id', Array.from(needVportIds))
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (vportsRes.error) throw vportsRes.error;

  const nextUserCache = { ...userAuthorCache };
  for (const u of profilesRes.data ?? []) nextUserCache[u.id] = u;

  const nextVportCache = { ...vportAuthorCache };
  for (const v of vportsRes.data ?? []) nextVportCache[v.id] = v;

  return {
    items: pageItems,
    nextHasMore,
    userAuthorCache: nextUserCache,
    vportAuthorCache: nextVportCache,
  };
}

/* Optional: quick probe for debugging from the console */
export async function __debugProbe() {
  const p1 = await supabase
    .from('posts')
    .select('id, user_id, text, media_type, media_url, visibility, deleted, created_at')
    .eq('visibility', 'public')
    .eq('deleted', false)
    .order('created_at', { ascending: false })
    .limit(5);

  const p2 = await supabase
    .from('vport_posts')
    .select('id, vport_id, title, body, media_type, media_url, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return { posts: p1, vport_posts: p2 };
}

const feed = { fetchPage, getViewerIsAdult };
export default feed;
