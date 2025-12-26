import { supabase } from '@/services/supabase/supabaseClient'

/**
 * DAL — Follow Requests (actor → actor)
 * Style locked:
 * - supabase.schema('vc')
 * - explicit selects
 * - raw DB rows only
 */

/**
 * Get request status for requester → target
 * Returns: string | null
 */
export async function dalGetRequestStatus({
  requesterActorId,
  targetActorId,
}) {
  const { data, error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .select('status')
    .eq('requester_actor_id', requesterActorId)
    .eq('target_actor_id', targetActorId)
    // 🔒 ACTIVE STATES ONLY
    .in('status', ['pending', 'accepted'])
    .maybeSingle()

  if (error) throw error
  return data?.status ?? null
}


/**
 * Create or revive a pending request
 */
export async function dalUpsertPendingRequest({
  requesterActorId,
  targetActorId,
}) {
  const { error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .upsert(
      {
        requester_actor_id: requesterActorId,
        target_actor_id: targetActorId,
        status: 'pending',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'requester_actor_id,target_actor_id' }
    )

  if (error) throw error
  return true
}

/**
 * Update request status
 */
/**
 * Update request status
 */
export async function dalUpdateRequestStatus({
  requesterActorId,
  targetActorId,
  status,
}) {
  const { error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('requester_actor_id', requesterActorId)
    .eq('target_actor_id', targetActorId)

  // 🔥 LOG RLS / PERMISSION FAILURES
  if (error) {
    console.error('[dalUpdateRequestStatus] FAILED', {
      requesterActorId,
      targetActorId,
      status,
      error,
    })
    throw error
  }

  return true
}


/**
 * List incoming pending requests for target actor
 */
export async function dalListIncomingPendingRequests({
  targetActorId,
}) {
  const { data, error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .select(
      'requester_actor_id,target_actor_id,status,created_at,updated_at'
    )
    .eq('target_actor_id', targetActorId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * List outgoing requests for requester actor
 */
export async function dalListOutgoingRequests({
  requesterActorId,
}) {
  const { data, error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .select(
      'requester_actor_id,target_actor_id,status,created_at,updated_at'
    )
    .eq('requester_actor_id', requesterActorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
