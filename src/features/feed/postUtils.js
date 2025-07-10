import { supabase } from '@/lib/supabaseClient';

/**
 * ✅ fetchPostsWithProfiles.js
 * 
 * Fetches paginated posts with profile data, filtered by viewer's age group.
 * 
 * @param {Object} options
 * @param {number} options.page - Page number starting from 0
 * @param {number} options.pageSize - Posts per page
 * @param {boolean} options.viewerIsAdult - Filter posts based on author adult status
 * @param {Object} [options.profileCache={}] - Optional profile cache
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

  // ✅ Only fetch non-video posts
  const { data: rawPosts, error } = await supabase
    .from('posts')
    .select('*')
    .not('media_type', 'eq', 'video')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  // Identify uncached user IDs
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

  // Merge profile data
  const updatedProfiles = { ...profileCache };
  for (const profile of newProfiles) {
    updatedProfiles[profile.id] = profile;
  }

  // Filter and enrich posts
  const enrichedPosts = rawPosts
    .map(post => {
      const user = updatedProfiles[post.user_id];
      return user ? { ...post, user } : null;
    })
    .filter(p => p?.user?.is_adult === viewerIsAdult);

  // Check if more posts exist
  const hasMore = rawPosts.length === pageSize;

  return {
    posts: enrichedPosts,
    updatedProfiles,
    hasMore
  };
}
