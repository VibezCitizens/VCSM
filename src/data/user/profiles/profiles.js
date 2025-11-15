import { supabase } from '@/lib/supabaseClient'

export async function isFollowing(viewerActorId, targetActorId) {
  if (!viewerActorId || !targetActorId) return false

  const { data, error } = await supabase
    .schema('vc')
    .from('actor_follows')
    .select('is_active')
    .eq('follower_actor_id', viewerActorId)
    .eq('followed_actor_id', targetActorId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('isFollowing error:', error)
    return false
  }

  return !!data?.is_active
}
