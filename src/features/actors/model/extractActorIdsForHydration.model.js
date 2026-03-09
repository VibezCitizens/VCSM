function resolveActorIdFromRow(row) {
  if (!row || typeof row !== "object") return null;

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
    row.actor_id ??
    row.actorId ??
    row.actor?.id ??
    row.actor?.actor_id ??
    null
  );
}

export function extractActorIdsForHydration(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const ids = new Set();

  for (const row of rows) {
    const actorId = resolveActorIdFromRow(row);
    if (!actorId) continue;
    ids.add(actorId);
  }

  return [...ids];
}
