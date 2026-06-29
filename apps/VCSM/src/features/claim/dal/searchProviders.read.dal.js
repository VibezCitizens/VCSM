// TICKET-TRAZE-CLAIM-LANDING-001 — claim business search (read-only).
//
// Powers the "find your business" landing of the claim funnel. Anonymous reads
// are allowed by the traffic.providers `providers_public_read` policy
// (is_active = true AND COALESCE(is_indexable, true) = true), the same policy
// the single-provider lookup relies on.
//
// This is display/discovery only — it is NOT the authority for claimability.
// traffic.submit_business_claim re-resolves the provider and enforces
// PROVIDER_NOT_FOUND / PROVIDER_ALREADY_CLAIMED at submit time.

import traffic from '@/services/supabase/trafficClient'

const SEARCH_SELECT =
  'id,slug,display_name,claim_status,claimed_by,avatar_url,city_name,address_text,business_type'

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 25

// Escape PostgREST `ilike` wildcards so user input can't widen the match.
function escapeLike(value) {
  return String(value ?? '').replace(/[%_,]/g, (c) => `\\${c}`)
}

/**
 * Search publicly-indexable providers by display name for the claim landing.
 * Returns [] on any error or miss (the UI degrades to the create/sign-in paths).
 *
 * @param {{ query?: string, limit?: number }} params
 * @returns {Promise<object[]>}
 */
export async function searchClaimableProviders({ query = '', limit = DEFAULT_LIMIT } = {}) {
  const term = String(query ?? '').trim()
  if (term.length < 2) return []

  const safeLimit = Math.min(Math.max(1, Number(limit) || DEFAULT_LIMIT), MAX_LIMIT)

  try {
    const { data, error } = await traffic
      .from('providers')
      .select(SEARCH_SELECT)
      .ilike('display_name', `%${escapeLike(term)}%`)
      .order('display_name', { ascending: true })
      .limit(safeLimit)

    if (error) return []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default { searchClaimableProviders }
