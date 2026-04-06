import { fetchFollowGraph } from "@/features/profiles/dal/friends/friends.read.dal";
import { listBlockedActorRowsForCandidatesDAL } from "@/features/profiles/dal/friends/blockedActorSet.read.dal";
import { deriveFriendLists } from "@/features/profiles/model/friends/friendGraph.model";

export async function getFriendListsController({ actorId }) {
  if (!actorId) {
    return {
      mutual: [],
      iAmFan: [],
      myFans: [],
    };
  }

  const graph = await fetchFollowGraph(actorId);
  const derived = deriveFriendLists(graph);

  const allCandidateIds = [
    ...derived.mutual,
    ...derived.iAmFan,
    ...derived.myFans,
  ];

  const blockedRows = await listBlockedActorRowsForCandidatesDAL({
    actorId,
    candidateActorIds: allCandidateIds,
  });
  const blockedSet = new Set();

  for (const row of blockedRows) {
    if (row?.blocker_actor_id === actorId && row?.blocked_actor_id) {
      blockedSet.add(row.blocked_actor_id);
      continue;
    }

    if (row?.blocked_actor_id === actorId && row?.blocker_actor_id) {
      blockedSet.add(row.blocker_actor_id);
    }
  }

  return {
    mutual: derived.mutual.filter((id) => !blockedSet.has(id)),
    iAmFan: derived.iAmFan.filter((id) => !blockedSet.has(id)),
    myFans: derived.myFans.filter((id) => !blockedSet.has(id)),
  };
}
