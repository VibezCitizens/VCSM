import { ctrlGetBlockedActorSet } from "@/features/block/adapters/controllers/getBlockedActorSet.controller.adapter";
import { fetchFollowGraph } from "@/features/profiles/dal/friends/friends.read.dal";
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

  const blockedSet = await ctrlGetBlockedActorSet({
    actorId,
    candidateActorIds: allCandidateIds,
  });

  return {
    mutual: derived.mutual.filter((id) => !blockedSet.has(id)),
    iAmFan: derived.iAmFan.filter((id) => !blockedSet.has(id)),
    myFans: derived.myFans.filter((id) => !blockedSet.has(id)),
  };
}
