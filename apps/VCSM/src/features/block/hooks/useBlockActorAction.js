import { useCallback } from "react";
import { blockActorController } from "@/features/block/controllers/blockActor.controller";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";

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

    return blockActorController(blockerActorId, blockedActorId, sessionActorId);
  }, [sessionActorId]);
}
