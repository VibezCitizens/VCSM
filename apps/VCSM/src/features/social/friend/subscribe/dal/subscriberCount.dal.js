import { supabase } from '@/services/supabase/supabaseClient'

export async function dalCountSubscribers({ actorId }) {
  if (!actorId) {
    return 0
  }

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
  return count ?? 0
}
