import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Reconcile / compact / optionally autofill owner's top friend ranks.
 * Uses DB contract RPC `vc.reconcile_friend_ranks`.
 */
export async function reconcileFriendRanks(ownerActorId, { autofill = true, maxCount = 10 } = {}) {
  if (!ownerActorId) return []

  const safeMaxCount = Math.max(1, Math.min(10, Number(maxCount || 10)))

  const { data, error } = await supabase
    .schema('vc')
    .rpc('reconcile_friend_ranks', {
      p_owner_actor_id: ownerActorId,
      p_autofill: Boolean(autofill),
      p_max_count: safeMaxCount,
    })

  if (error) throw error
  return data ?? []
}
