// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\models\wandersClaim.model.js
// ============================================================================
// WANDERS MODEL — CLAIM
// ============================================================================

export function toWandersClaim(row) {
  if (!row) return null
  return {
    id: row.id,
    anonId: row.anon_id,
    actorId: row.actor_id,
    claimedSender: row.claimed_sender,
    claimedRecipient: row.claimed_recipient,
    createdAt: row.created_at,
  }
}
