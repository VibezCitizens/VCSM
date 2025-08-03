import { supabase } from '@/lib/supabaseClient';

/**
 * Fetches paginated posts with profile data, filtered by viewer's age group.
 *
 * @param {Object} options
 * @param {number} options.page - Page number starting from 0
 * @param {number} options.pageSize - Posts per page
 * @param {boolean} options.viewerIsAdult - Whether the viewer is an adult
 * @param {Object} [options.profileCache={}] - Cached profiles
 * @returns {Promise<{ posts: Array, updatedProfiles: Object, hasMore: boolean }>}
 */
export async function fetchPostsWithProfiles({
  page,
  pageSize,
  viewerIsAdult,
  profileCache = {}
}) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // ✅ Only fetch non-video posts and exclude soft-deleted ones
  const { data: rawPosts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('deleted', false) // ✅ Soft-delete support
    .neq('media_type', 'video')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  console.log('[🔍 fetchPostsWithProfiles] Raw posts:', rawPosts);

  // 🔎 Get uncached profile IDs
  const missingUserIds = Array.from(
    new Set(rawPosts.map(p => p.user_id).filter(uid => !profileCache[uid]))
  );

  let newProfiles = [];
  if (missingUserIds.length > 0) {
    const { data: fetchedProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_adult, display_name, photo_url')
      .in('id', missingUserIds);

    if (profileError) throw profileError;
    newProfiles = fetchedProfiles || [];
  }

  console.log('[👤 Profiles] Fetched:', newProfiles);

  // 🧠 Merge profile cache
  const updatedProfiles = { ...profileCache };
  for (const profile of newProfiles) {
    updatedProfiles[profile.id] = profile;
  }

  // 🧩 Enrich + Filter by age gate
  const enrichedPosts = rawPosts
    .map(post => {
      const user = updatedProfiles[post.user_id];
      return {
        ...post,
        user: user || {
          id: post.user_id,
          display_name: 'Unknown',
          photo_url: '/avatar.jpg',
          is_adult: true // assume adult if profile missing
        }
      };
    })
    .filter(p => {
      const allowed =
        viewerIsAdult === true || (viewerIsAdult === false && p.user?.is_adult === false);

      console.log(`[🧪 Filter] Post ${p.id} | viewer: ${viewerIsAdult} | author: ${p.user?.is_adult} | allowed: ${allowed}`);
      return allowed;
    });

  console.log('[✅ Final Posts]', enrichedPosts);

  return {
    posts: enrichedPosts,
    updatedProfiles,
    hasMore: rawPosts.length === pageSize
  };
}
