export function buildFollowedActorSetModel({ followRows = [] }) {
  const followedActorSet = new Set();

  for (const row of Array.isArray(followRows) ? followRows : []) {
    const followedActorId = row?.followed_actor_id ?? null;
    const isActive = row?.is_active === true;

    if (followedActorId && isActive) {
      followedActorSet.add(followedActorId);
    }
  }

  return followedActorSet;
}

export function isActorFollowedByViewerModel({
  actorId,
  followedActorSet,
}) {
  if (!actorId) return false;
  if (!(followedActorSet instanceof Set)) return false;
  return followedActorSet.has(actorId);
}

