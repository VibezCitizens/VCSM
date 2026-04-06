import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Reconcile owner's top friend ranks.
 * Reads current ranks, re-saves through the RPC to validate eligibility.
 * No autofill — friend ranks are manual-only.
 */
export async function reconcileFriendRanks(ownerActorId) {
  if (!ownerActorId) return []

  const { data: current, error: readErr } = await supabase
    .schema('vc')
    .rpc('get_friend_ranks', { p_owner_actor_id: ownerActorId })

  if (readErr) throw readErr

  const currentIds = (current ?? []).map(r => r.friend_actor_id).filter(Boolean)
  if (!currentIds.length) return []

  const { data, error } = await supabase
    .schema('vc')
    .rpc('save_friend_ranks', {
      p_owner_actor_id: ownerActorId,
      p_friend_actor_ids: currentIds,
      p_max_count: 10,
    })

  if (error) throw error
  return data ?? []
}
