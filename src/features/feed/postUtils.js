import { supabase } from '@/lib/supabaseClient';

/**
 * Filters posts based on viewer's age group (adult or not).
 * Assumes each post has a `user` object with `is_adult` field.
 *
 * @param {Array} posts
 * @param {boolean} viewerIsAdult
 * @returns {Array}
 */
export function filterPostsByAgeGroup(posts, viewerIsAdult) {
  return posts.filter(post => post.user?.is_adult === viewerIsAdult);
}

/**
 * Fetches posts with user profile data, paginated and filtered by viewer's age group.
 *
 * @param {Object} options
 * @param {number} options.page
 * @param {number} options.pageSize
 * @param {boolean} options.viewerIsAdult
 * @param {Object} [options.profileCache={}]
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

  const { data: rawPosts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const updatedProfiles = { ...profileCache };
  const enrichedPosts = [];

  for (const post of rawPosts) {
    const uid = post.user_id;

    if (!updatedProfiles[uid]) {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('is_adult, display_name, photo_url')
        .eq('id', uid)
        .maybeSingle();

      if (!profileErr && profile) {
        updatedProfiles[uid] = {
          id: uid,
          ...profile
        };
      }
    }

    const author = updatedProfiles[uid];
    if (author && author.is_adult === viewerIsAdult) {
      enrichedPosts.push({
        ...post,
        user: author
      });
    }
  }

  return {
    posts: enrichedPosts,
    updatedProfiles,
    hasMore: rawPosts.length === pageSize
  };
}
