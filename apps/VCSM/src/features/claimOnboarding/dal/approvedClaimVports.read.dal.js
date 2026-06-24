// TICKET-TRAZE-CLAIM-VPORT-007 (T7) — read-only discovery of the caller's
// approved Traze claims and the VPORTs they were connected to.
//
// Pull-based (no push notification required): the owner can read their OWN
// approved claims via the business_claim_requests own_select RLS policy
// (requester_user_id = auth.uid()), then resolve the connected VPORT through
// providers.claimed_by (public read) → vport.profiles (owner read).

import traffic from '@/services/supabase/trafficClient'
import vport from '@/services/supabase/vportClient'

// The owner's approved claims (RLS scopes rows to requester_user_id = auth.uid()).
export async function readMyApprovedClaims() {
  const { data, error } = await traffic
    .from('business_claim_requests')
    .select('id, provider_id, provider_slug, business_name, requester_actor_id, claim_status, reviewed_at')
    .eq('claim_status', 'approved')
    .order('reviewed_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// The VPORT actor a provider was claimed by (providers_public_read).
export async function readProviderClaimedActor(providerId) {
  if (!providerId) return null
  const { data, error } = await traffic
    .from('providers')
    .select('id, slug, display_name, claimed_by, avatar_url, city_name')
    .eq('id', providerId)
    .maybeSingle()
  if (error) return null
  return data ?? null
}

// The connected VPORT profile (owner-readable), for the activation checklist.
export async function readVportProfileByActor(actorId) {
  if (!actorId) return null
  const { data, error } = await vport
    .from('profiles')
    .select('id, actor_id, name, slug, avatar_url, banner_url, bio, is_active, directory_visible')
    .eq('actor_id', actorId)
    .maybeSingle()
  if (error) return null
  return data ?? null
}

export default { readMyApprovedClaims, readProviderClaimedActor, readVportProfileByActor }
