export function buildBlockedActorSetModel({
  viewerActorId,
  blockRows = [],
}) {
  const blockedActorSet = new Set();
  if (!viewerActorId) return blockedActorSet;

  for (const row of Array.isArray(blockRows) ? blockRows : []) {
    const blockerActorId = row?.blocker_actor_id ?? null;
    const blockedActorId = row?.blocked_actor_id ?? null;

    if (blockerActorId === viewerActorId && blockedActorId) {
      blockedActorSet.add(blockedActorId);
      continue;
    }

    if (blockedActorId === viewerActorId && blockerActorId) {
      blockedActorSet.add(blockerActorId);
    }
  }

  return blockedActorSet;
}

export function isActorBlockedForViewerModel({
  actorId,
  blockedActorSet,
}) {
  if (!actorId) return false;
  if (!(blockedActorSet instanceof Set)) return false;
  return blockedActorSet.has(actorId);
}

