import {
  readActorPrivacyByActorIdsDAL,
  readActorsByIdsDAL,
  readFollowRowsByActorsDAL,
  readOwnedActorIdsByUserIdDAL,
  readPostActorsByIdsDAL,
} from "@/features/feed/dal/feed.read.debugPrivacyRows.dal";

function buildActorMap(rows) {
  return (rows ?? []).reduce((acc, row) => {
    acc[row.id] = row;
    return acc;
  }, {});
}

function buildPrivacyMap(rows) {
  return (rows ?? []).reduce((acc, row) => {
    acc[row.actor_id] = row.is_private === true;
    return acc;
  }, {});
}

function buildFollowSet(rows) {
  return new Set(
    (rows ?? [])
      .filter((row) => row.is_active)
      .map((row) => `${row.follower_actor_id}->${row.followed_actor_id}`)
  );
}

export async function getDebugPrivacyRowsController({ actorId, postIds }) {
  if (!actorId) return [];
  if (!Array.isArray(postIds) || postIds.length === 0) return [];

  const postActors = await readPostActorsByIdsDAL(postIds);
  const actorIds = [...new Set(postActors.map((row) => row.actor_id).filter(Boolean))];
  if (!actorIds.length) return [];

  const [actors, actorPrivacyRows, ownedActorRows] = await Promise.all([
    readActorsByIdsDAL(actorIds),
    readActorPrivacyByActorIdsDAL(actorIds),
    readOwnedActorIdsByUserIdDAL(actorId),
  ]);

  const actorMap = buildActorMap(actors);
  const actorPrivacyMap = buildPrivacyMap(actorPrivacyRows);
  const myActorIds = (ownedActorRows ?? []).map((row) => row.actor_id).filter(Boolean);

  const followRows = await readFollowRowsByActorsDAL({
    followerActorIds: myActorIds,
    followedActorIds: actorIds,
  });
  const followSet = buildFollowSet(followRows);

  return postActors.map((postActor) => {
    const actor = actorMap[postActor.actor_id];
    const isVport = Boolean(actor?.vport_id);
    const isOwner = !isVport && actor?.profile_id === actorId;
    const isPrivate = actorPrivacyMap[postActor.actor_id] ?? true;
    const isPublic = !isPrivate;

    let isFollower = false;
    if (actor && !isVport) {
      for (const myActorId of myActorIds) {
        if (followSet.has(`${myActorId}->${actor.id}`)) {
          isFollower = true;
          break;
        }
      }
    }

    return {
      post_id: postActor.id,
      actor_id: postActor.actor_id,
      profile_id: actor?.profile_id ?? null,
      vport_id: actor?.vport_id ?? null,
      isVport,
      isOwner,
      isPublic,
      isFollower,
      visibleByPolicy: isVport || isOwner || isPublic || isFollower,
    };
  });
}

