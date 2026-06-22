import { useCallback } from "react";
import { blockActorController } from "@/features/block/controllers/blockActor.controller";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { invalidateFeedBlockCache } from "@/features/CentralFeed/adapters/feedCache.adapter";

export function useBlockActorAction() {
  const { identity } = useIdentity();
  const sessionActorId = identity?.actorId ?? null;

  return useCallback(async ({ blockerActorId, blockedActorId }) => {
    if (!blockerActorId || !blockedActorId) {
      throw new Error("Missing actor ids");
    }
    if (blockerActorId === blockedActorId) {
      throw new Error("Cannot block yourself");
    }

    const result = await blockActorController(blockerActorId, blockedActorId, sessionActorId);
    invalidateFeedBlockCache(blockerActorId);
    return result;
  }, [sessionActorId]);
}
