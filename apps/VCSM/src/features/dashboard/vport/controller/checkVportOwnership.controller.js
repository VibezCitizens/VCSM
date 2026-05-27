import { assertActorOwnsVportActorController, getActorByIdDAL } from "@/features/booking/adapters/booking.adapter";

export async function checkVportOwnershipController({ callerActorId, targetActorId } = {}) {
  if (!callerActorId || !targetActorId) return false;
  try {
    // If the caller IS the vport actor (acting-as mode), self-ownership is immediate.
    if (callerActorId === targetActorId) {
      const actor = await getActorByIdDAL({ actorId: callerActorId });
      if (actor && actor.kind === "vport" && !actor.is_void) return true;
    }
    await assertActorOwnsVportActorController({
      requestActorId: callerActorId,
      targetActorId,
    });
    return true;
  } catch {
    return false;
  }
}
