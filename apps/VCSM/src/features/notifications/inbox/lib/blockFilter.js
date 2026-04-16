import {
  listBlockedActorRowsDAL,
  listBlockingActorRowsDAL,
} from "@/features/notifications/inbox/dal/blocks.read.dal";

export async function loadBlockSets(myActorId) {
  if (!myActorId) {
    return { iBlocked: new Set(), blockedMe: new Set() };
  }

  const [iBlockedRows, blockedMeRows] = await Promise.all([
    listBlockedActorRowsDAL({ actorId: myActorId }),
    listBlockingActorRowsDAL({ actorId: myActorId }),
  ]);

  return {
    iBlocked: new Set((iBlockedRows ?? []).map((row) => row.blocked_actor_id)),
    blockedMe: new Set((blockedMeRows ?? []).map((row) => row.blocker_actor_id)),
  };
}

export function filterByBlocks(rows, blocks, { getActorId } = {}) {
  const resolve = getActorId ?? ((row) => row.actor_id)
  return rows.filter((row) => {
    const actorId = resolve(row)
    if (!actorId) return true;
    if (blocks.iBlocked.has(actorId)) return false;
    if (blocks.blockedMe.has(actorId)) return false;
    return true;
  });
}
