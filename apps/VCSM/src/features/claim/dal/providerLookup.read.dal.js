// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — provider display lookup (read-only).
//
// Best-effort resolve of the Traze provider being claimed, for display +
// confirmation on the claim screen. Anonymous reads are allowed by the
// traffic.providers `providers_public_read` policy
// (is_active = true AND COALESCE(is_indexable, true) = true).
//
// This is NOT the authority for claimability — traffic.submit_business_claim
// re-resolves the provider and enforces PROVIDER_NOT_FOUND / PROVIDER_ALREADY_CLAIMED
// on submit. A failed/empty read here degrades gracefully to the slug.

import traffic from '@/services/supabase/trafficClient'

const PROVIDER_SELECT =
  'id,slug,display_name,claim_status,claimed_by,avatar_url,city_name,address_text,business_type'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value)
}

/**
 * Read a publicly-indexable provider by id or slug.
 * Returns null on any error or miss (caller falls back to the raw slug).
 *
 * @param {{ id?: string|null, slug?: string|null }} params
 * @returns {Promise<object|null>}
 */
export async function fetchClaimableProvider({ id = null, slug = null } = {}) {
  try {
    let query = traffic.from('providers').select(PROVIDER_SELECT)

    if (id && isUuid(id)) {
      query = query.eq('id', id)
    } else if (slug) {
      query = query.eq('slug', slug)
    } else {
      return null
    }

    const { data, error } = await query.maybeSingle()
    if (error) return null
    return data ?? null
  } catch {
    return null
  }
}

export default { fetchClaimableProvider, isUuid }
