import { supabase } from '@/services/supabase/supabaseClient'

export async function dalCountSubscribers({ actorId }) {
  console.group('[dalCountSubscribers]')
  console.log('actorId:', actorId)

  if (!actorId) {
    console.warn('❌ no actorId')
    console.groupEnd()
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

  console.log('count:', count)
  console.log('error:', error)
  console.groupEnd()

  if (error) throw error
  return count ?? 0
}
