import { supabase } from '@/lib/supabaseClient';

/**
 * Unified feed loader: user posts + VPort posts (no videos) with caching for user profiles.
 */
export async function fetchPostsWithProfiles({
  page,
  pageSize,
  viewerIsAdult,
  profileCache = {},
}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // --- USER POSTS (exclude videos & soft-deleted)
  const { data: rawUserPosts, error: postsErr } = await supabase
    .from('posts')
    .select('*')
    .eq('deleted', false)
    .not('media_type', 'eq', 'video')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (postsErr) throw postsErr;

  // fetch any missing author profiles
  const missingIds = Array.from(
    new Set(rawUserPosts.map((p) => p.user_id).filter((id) => !profileCache[id]))
  );

  let fetchedProfiles = [];
  if (missingIds.length) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, is_adult, display_name, photo_url, username')
      .in('id', missingIds);
    if (error) throw error;
    fetchedProfiles = data || [];
  }

  const updatedProfiles = { ...profileCache };
  for (const prof of fetchedProfiles) updatedProfiles[prof.id] = prof;

  // age gate for user posts (minors only when viewer is NOT adult)
  const userItems = (rawUserPosts || [])
    .map((p) => {
      const author = updatedProfiles[p.user_id];
      return {
        kind: 'user',
        id: p.id,
        user_id: p.user_id,
        text: p.text || '',
        media_type: p.media_type,
        media_url: p.media_url,
        created_at: p.created_at,
        like_count: p.like_count || 0,
        dislike_count: p.dislike_count || 0,
        author: author || {
          id: p.user_id,
          is_adult: true,
          display_name: 'Unknown',
          photo_url: '/avatar.jpg',
        },
      };
    })
    .filter((it) => viewerIsAdult === true || (viewerIsAdult === false && it.author.is_adult === false));

  // --- VPORT POSTS (exclude videos)
  const { data: rawVpp, error: vppErr } = await supabase
    .from('vport_posts')
    .select('id,vport_id,body,media_url,media_type,created_at,created_by')
    .not('media_type', 'eq', 'video')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (vppErr) throw vppErr;

  // hydrate vport info
  const vportIds = Array.from(new Set((rawVpp || []).map((x) => x.vport_id)));
  let vports = [];
  if (vportIds.length) {
    const { data, error } = await supabase
      .from('vports')
      .select(
        'id,name,avatar_url,verified,city,region,country,updated_at,created_at'
      )
      .in('id', vportIds);
    if (error) throw error;
    vports = data || [];
  }
  const vMap = Object.fromEntries(vports.map((v) => [v.id, v]));

  const vportItems = (rawVpp || []).map((p) => ({
    kind: 'vport',
    id: p.id,
    vport_id: p.vport_id,
    created_by: p.created_by,
    created_at: p.created_at,
    body: p.body || '',
    media_type: p.media_type,
    media_url: p.media_url,
    vport: vMap[p.vport_id]
      ? {
          id: vMap[p.vport_id].id,
          name: vMap[p.vport_id].name,
          avatar_url: vMap[p.vport_id].avatar_url,
          verified: Boolean(vMap[p.vport_id].verified),
          city: vMap[p.vport_id].city,
          region: vMap[p.vport_id].region,
          country: vMap[p.vport_id].country,
          updated_at: vMap[p.vport_id].updated_at,
          created_at: vMap[p.vport_id].created_at,
        }
      : { id: p.vport_id, name: 'VPort', verified: false },
  }));

  // merge & sort
  const merged = [...userItems, ...vportItems].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  // NOTE: hasMore is based on user-post window; good enough for infinite scroll
  return {
    posts: merged,
    updatedProfiles,
    hasMore: (rawUserPosts || []).length === pageSize,
  };
}
