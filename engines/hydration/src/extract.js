// engines/hydration/src/extract.js
// ============================================================
// Smart actor ID extraction from any row shape
// ============================================================

/**
 * Resolve an actor ID from a row with many possible naming conventions.
 */
function resolveActorIdFromRow(row) {
  if (!row || typeof row !== 'object') return null

  return (
    row.author_actor_id ??
    row.authorActorId ??
    row.requester_actor_id ??
    row.requesterActorId ??
    row.target_actor_id ??
    row.targetActorId ??
    row.customer_actor_id ??
    row.customerActorId ??
    row.follower_actor_id ??
    row.followerActorId ??
    row.followed_actor_id ??
    row.followedActorId ??
    row.blocked_actor_id ??
    row.blockedActorId ??
    row.blocker_actor_id ??
    row.blockerActorId ??
    row.sender_actor_id ??
    row.senderActorId ??
    row.actor_id ??
    row.actorId ??
    row.actor?.id ??
    row.actor?.actor_id ??
    null
  )
}

/**
 * Extract unique actor IDs from an array of rows.
 * Handles any naming convention via resolveActorIdFromRow.
 *
 * @param {Array} rows — any array of objects with actor references
 * @returns {string[]} — deduplicated actor IDs
 */
export function extractActorIdsForHydration(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return []

  const ids = new Set()

  for (const row of rows) {
    const actorId = resolveActorIdFromRow(row)
    if (!actorId) continue
    ids.add(actorId)
  }

  return [...ids]
}
