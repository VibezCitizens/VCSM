import { useCallback } from "react";
import { blockActorController } from "@/features/block/controllers/blockActor.controller";

export function useBlockActorAction() {
  return useCallback(async ({ blockerActorId, blockedActorId }) => {
    if (!blockerActorId || !blockedActorId) {
      throw new Error("Missing actor ids");
    }
    if (blockerActorId === blockedActorId) {
      throw new Error("Cannot block yourself");
    }

    return blockActorController(blockerActorId, blockedActorId);
  }, []);
}
