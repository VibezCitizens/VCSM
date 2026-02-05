// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\controllers\wandersClaims.controller.js
// ============================================================================
// WANDERS CONTROLLER — CLAIMS
// NOTE: This assumes actor integration exists + RLS allows actor-owner inserts.
// ============================================================================

import { createWandersClaim, listWandersClaimsByAnonId, listWandersClaimsByActorId, updateWandersClaim } from '@/features/wanders/dal/wandersClaims.dal'
import { ensureWandersAnonIdentity } from '@/features/wanders/controllers/ensureWandersAnon.controller'
import { toWandersClaim } from '@/features/wanders/models/wandersClaim.model'

/**
 * Create a claim linking current anon -> actor.
 * @param {{ actorId: string, claimedSender?: boolean, claimedRecipient?: boolean }} input
 */
export async function createClaimForCurrentAnon(input) {
  const anon = await ensureWandersAnonIdentity({ touch: true })

  const row = await createWandersClaim({
    anonId: anon.id,
    actorId: input.actorId,
    claimedSender: input.claimedSender ?? false,
    claimedRecipient: input.claimedRecipient ?? false,
  })

  return toWandersClaim(row)
}

/**
 * List claims for current anon.
 * @param {{ limit?: number }} input
 */
export async function listClaimsForCurrentAnon(input = {}) {
  const anon = await ensureWandersAnonIdentity({ touch: true })
  const rows = await listWandersClaimsByAnonId({ anonId: anon.id, limit: input.limit ?? 50 })
  return rows.map(toWandersClaim)
}

/**
 * List claims by actor id (RLS should restrict to actor owners).
 * @param {{ actorId: string, limit?: number }} input
 */
export async function listClaimsForActor(input) {
  const rows = await listWandersClaimsByActorId({ actorId: input.actorId, limit: input.limit ?? 50 })
  return rows.map(toWandersClaim)
}

/**
 * Update claim flags (RLS should restrict).
 * @param {{ claimId: string, claimedSender?: boolean, claimedRecipient?: boolean }} input
 */
export async function updateClaim(input) {
  const row = await updateWandersClaim({
    claimId: input.claimId,
    claimedSender: input.claimedSender,
    claimedRecipient: input.claimedRecipient,
  })
  return toWandersClaim(row)
}
