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

export function filterByBlocks(rows, blocks) {
  return rows.filter((row) => {
    if (!row.actor_id) return true;
    if (blocks.iBlocked.has(row.actor_id)) return false;
    if (blocks.blockedMe.has(row.actor_id)) return false;
    return true;
  });
}
