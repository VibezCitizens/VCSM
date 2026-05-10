import { supabase } from '@/services/supabase/supabaseClient'
import { isUuid } from '@/services/supabase/postgrestSafe'

export async function readFollowStateDAL({ viewerActorId, targetActorId }) {
  if (!viewerActorId || !targetActorId) return { is_active: false }
  if (!isUuid(viewerActorId) || !isUuid(targetActorId)) return { is_active: false }
  if (viewerActorId === targetActorId) return { is_active: false }

  const { data, error } = await supabase
    .schema('vc')
    .from('actor_follows')
    .select('is_active')
    .eq('follower_actor_id', viewerActorId)
    .eq('followed_actor_id', targetActorId)
    .maybeSingle()

  if (error) throw error

  return data ?? { is_active: false }
}
