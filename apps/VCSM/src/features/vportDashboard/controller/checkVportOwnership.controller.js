import {
  assertActorOwnsActorController,
  readActorStatusController,
} from "@/features/authorization/adapters/authorization.adapter";

export async function checkVportOwnershipController({ callerActorId, targetActorId } = {}) {
  if (!callerActorId || !targetActorId) return false;
  try {
    // Dashboard access: a VPORT actor viewing its own dashboard is granted access.
    // This is a navigation/visibility gate only — mutations require a user-kind actor.
    if (callerActorId === targetActorId) {
      const status = await readActorStatusController({ actorId: callerActorId });
      if (status && status.kind === "vport" && !status.isVoid) return true;
    }
    await assertActorOwnsActorController({
      requestActorId: callerActorId,
      targetActorId,
    });
    return true;
  } catch {
    return false;
  }
}
