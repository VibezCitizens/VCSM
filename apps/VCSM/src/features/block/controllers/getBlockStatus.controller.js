import { checkBlockStatus } from "@/features/block/dal/block.check.dal";

export async function ctrlGetBlockStatus({ actorId, targetActorId }) {
  if (!actorId || !targetActorId || actorId === targetActorId) {
    return {
      isBlocked: false,
      blockedMe: false,
    };
  }

  return checkBlockStatus(actorId, targetActorId);
}
