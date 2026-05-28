import { assertActorOwnsVportActorController, getActorByIdDAL } from "@/features/booking/adapters/booking.adapter";

export async function checkVportOwnershipController({ callerActorId, targetActorId } = {}) {
  if (!callerActorId || !targetActorId) return false;
  try {
    // Dashboard access: a VPORT actor viewing its own dashboard is granted access.
    // This is a navigation/visibility gate only — mutations require a user-kind actor.
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
