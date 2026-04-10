import { supabase } from '@/services/supabase/supabaseClient'
import { createTTLCache } from '@/shared/lib/ttlCache'

const followerCountCache = createTTLCache(60_000) // 60 seconds

export async function dalCountSubscribers({ actorId }) {
  if (!actorId) return 0

  const cached = followerCountCache.get(actorId)
  if (cached != null) return cached

  const { count, error } = await supabase
    .schema('vc')
    .from('actor_follows')
    .select('follower_actor_id', {
      count: 'exact',
      head: true,
    })
    .eq('followed_actor_id', actorId)
    .eq('is_active', true)

  if (error) throw error
  const result = count ?? 0
  followerCountCache.set(actorId, result)
  return result
}

export function invalidateFollowerCount(actorId) {
  followerCountCache.invalidate(actorId)
}
