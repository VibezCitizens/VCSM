import { supabase } from '@/lib/supabaseClient';

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

export async function getProfileByUsername(username) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();
}

export async function getProfileById(userId) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
}

export async function getFollowersInfo(targetUserId) {
  const [countRes, listRes] = await Promise.all([
    supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', targetUserId),
    supabase
      .from('followers')
      .select('follower_id, profiles!fk_follower(display_name, photo_url, username)')
      .eq('followed_id', targetUserId)
      .limit(24),
  ]);

  const subscribers = (listRes.data || []).map(r => r.profiles).filter(Boolean);
  return { count: countRes.count ?? 0, subscribers, error: countRes.error || listRes.error };
}

export async function amIFollowing(viewerId, targetUserId) {
  if (!viewerId || !targetUserId || viewerId === targetUserId) return false;
  const { data } = await supabase
    .from('followers')
    .select('id')
    .eq('follower_id', viewerId)
    .eq('followed_id', targetUserId)
    .maybeSingle();
  return Boolean(data);
}

export async function getPostsForUser(userId) {
  // Select only what the UI uses
  return supabase
    .from('posts')
    .select('id,text,title,media_type,media_url,post_type,tags,created_at,user_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}
