/**
 * vportOwnership.model.js
 *
 * Pure derivation of VPORT ownership from actor identity.
 *
 * Contract:
 *   - Each actor is independent.
 *   - To own a VPORT the active (viewer) actor must BE the target actor.
 *   - Account/user membership does NOT grant ownership.
 *   - userId is never consulted — only actor IDs are compared.
 *
 * This function is the single source of truth for all UI-level isOwner signals
 * on the VPORT profile screen. Server write paths enforce the same rule
 * independently via actor_owners + checkVportOwnershipController.
 */

/**
 * Returns true only when the viewer's active actor IS the target profile actor.
 *
 * @param {{ viewerActorId: string|null, profileActorId: string|null }} opts
 * @returns {boolean}
 */
export function deriveVportIsOwner({ viewerActorId, profileActorId }) {
  if (!viewerActorId || !profileActorId) return false;
  return String(viewerActorId) === String(profileActorId);
}
