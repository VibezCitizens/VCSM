// src/features/chat/permissions/isActorBlocked.js
// ============================================================
// isActorBlocked
// ------------------------------------------------------------
// - Actor-based block check
// - Pure function (no IO)
// - Uses preloaded block relationships
// ============================================================

/**
 * Determine whether messaging is blocked between two actors.
 *
 * Rules:
 * ------------------------------------------------------------
 * - Block is symmetric for chat purposes:
 *   if either actor blocked the other → communication blocked
 *
 * @param {Object} params
 * @param {string} params.actorId          // current actor
 * @param {string} params.otherActorId     // target actor
 * @param {Array}  params.blocks           // user_blocks rows
 *
 * @returns {boolean}
 */
export default function isActorBlocked({
  actorId,
  otherActorId,
  blocks,
}) {
  if (!actorId || !otherActorId || !Array.isArray(blocks)) {
    return false
  }

  return blocks.some(
    (b) =>
      (b.blocker_actor_id === actorId &&
        b.blocked_actor_id === otherActorId) ||
      (b.blocker_actor_id === otherActorId &&
        b.blocked_actor_id === actorId)
  )
}
