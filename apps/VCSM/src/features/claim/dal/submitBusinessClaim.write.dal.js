// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — claim submission DAL.
//
// Single write path for the public /claim-profile funnel. Calls the T2
// SECURITY DEFINER RPC traffic.submit_business_claim, which inserts a PENDING
// traffic.business_claim_requests row. It NEVER grants ownership, never sets
// providers.claimed_by, and never creates actors/vports — approval is T4.

import traffic from '@/services/supabase/trafficClient'

/**
 * Submit a pending business claim for a Traze provider.
 *
 * @param {object} input
 * @param {string}      input.providerSlug      provider slug (required by RPC signature)
 * @param {string|null} [input.providerId]      provider uuid (preferred resolver when known)
 * @param {string}      input.ownerName         claimant's name (required)
 * @param {string}      input.role              owner|manager|employee|agency
 * @param {string}      input.contactMethod     phone|email
 * @param {string|null} [input.phone]
 * @param {string|null} [input.email]
 * @param {string|null} [input.verificationMethod] phone|email|manual_review
 * @param {string|null} [input.businessName]
 * @param {string|null} [input.instagramUrl]
 * @param {string|null} [input.websiteUrl]
 * @param {string|null} [input.proofImageUrl]
 * @param {string|null} [input.notes]
 * @param {string|null} [input.sourceUrl]
 * @param {string|null} [input.requesterActorId] caller-owned Citizen actor id
 * @returns {Promise<{ claimId: string, claimStatus: string, providerId: string }>}
 * @throws {Error} with the raw RPC error code (e.g. PROVIDER_ALREADY_CLAIMED)
 */
export async function submitBusinessClaim({
  providerSlug,
  providerId = null,
  ownerName,
  role,
  contactMethod,
  phone = null,
  email = null,
  verificationMethod = null,
  businessName = null,
  instagramUrl = null,
  websiteUrl = null,
  proofImageUrl = null,
  notes = null,
  sourceUrl = null,
  requesterActorId = null,
}) {
  const { data, error } = await traffic.rpc('submit_business_claim', {
    p_provider_slug: providerSlug ?? null,
    p_owner_name: ownerName,
    p_role: role,
    p_contact_method: contactMethod,
    p_provider_id: providerId,
    p_phone: phone,
    p_email: email,
    p_verification_method: verificationMethod,
    p_business_name: businessName,
    p_instagram_url: instagramUrl,
    p_website_url: websiteUrl,
    p_proof_image_url: proofImageUrl,
    p_notes: notes,
    p_source_url: sourceUrl,
    p_requester_actor_id: requesterActorId,
  })

  if (error) {
    // Re-throw the Postgres exception message so the model can map known codes.
    throw new Error(error.message || String(error))
  }

  // RETURNS TABLE — PostgREST returns an array of rows.
  const row = Array.isArray(data) ? data[0] : data
  if (!row?.claim_id) {
    throw new Error('CLAIM_SUBMIT_NO_RESULT')
  }

  return {
    claimId: row.claim_id,
    claimStatus: row.claim_status,
    providerId: row.provider_id,
  }
}

export default { submitBusinessClaim }
