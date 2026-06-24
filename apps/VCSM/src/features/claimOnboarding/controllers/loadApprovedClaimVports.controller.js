// TICKET-TRAZE-CLAIM-VPORT-007 (T7) — resolve the caller's approved claims into
// connected-VPORT onboarding items. Read-only; never mutates ownership.

import {
  readMyApprovedClaims,
  readProviderClaimedActor,
  readVportProfileByActor,
} from '@/features/claimOnboarding/dal/approvedClaimVports.read.dal'

/**
 * @returns {Promise<Array<{
 *   claimId: string, businessName: string, providerSlug: string|null,
 *   vportActorId: string, vportName: string, vportSlug: string|null,
 *   reviewedAt: string|null, profile: object|null
 * }>>}
 */
export async function loadApprovedClaimVports() {
  const claims = await readMyApprovedClaims()
  if (!claims.length) return []

  const items = await Promise.all(
    claims.map(async (claim) => {
      const provider = await readProviderClaimedActor(claim.provider_id)
      const vportActorId = provider?.claimed_by ?? null
      if (!vportActorId) return null // approved but not yet connected to a VPORT actor

      const profile = await readVportProfileByActor(vportActorId)
      return {
        claimId: claim.id,
        businessName: claim.business_name || provider?.display_name || claim.provider_slug,
        providerSlug: claim.provider_slug ?? provider?.slug ?? null,
        vportActorId,
        vportName: profile?.name || claim.business_name || 'your business',
        vportSlug: profile?.slug ?? null,
        reviewedAt: claim.reviewed_at ?? null,
        profile,
      }
    }),
  )

  return items.filter(Boolean)
}
