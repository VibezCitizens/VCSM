import { filterBlockedActors } from "@/features/block/dal/block.read.dal";

export async function ctrlGetBlockedActorSet({ actorId, candidateActorIds = [] }) {
  return filterBlockedActors(actorId, candidateActorIds);
}
