
import { supabase } from '@/lib/supabaseClient';

export async function isFollowing(viewerId, profileId) {
  if (!viewerId || !profileId) return false;
  const { data, error } = await supabase
    .schema('vc')
    .from('followers')
    .select('is_active')
    .eq('follower_id', viewerId)
    .eq('followed_id', profileId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) return false;
  return !!data?.is_active;
}
