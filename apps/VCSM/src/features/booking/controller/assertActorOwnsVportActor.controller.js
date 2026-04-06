import getActorByIdDAL from "@/features/booking/dal/getActorById.dal";
import readActorOwnerLinkByActorAndUserProfileDAL from "@/features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal";

export async function assertActorOwnsVportActorController({
  requestActorId,
  targetActorId,
} = {}) {
  if (!requestActorId) {
    throw new Error("assertActorOwnsVportActorController: requestActorId is required");
  }
  if (!targetActorId) {
    throw new Error("assertActorOwnsVportActorController: targetActorId is required");
  }

  if (String(requestActorId) === String(targetActorId)) {
    return { ok: true, mode: "self" };
  }

  const requesterActor = await getActorByIdDAL({ actorId: requestActorId });
  if (!requesterActor || requesterActor.is_void === true) {
    throw new Error("Requester actor not found.");
  }

  if (requesterActor.kind !== "user") {
    throw new Error("Only actor owners can manage this booking resource.");
  }

  const requesterProfileId = requesterActor.profile_id ?? null;
  if (!requesterProfileId) {
    throw new Error("Requester actor is missing profile ownership identity.");
  }

  const ownerLink = await readActorOwnerLinkByActorAndUserProfileDAL({
    targetActorId,
    userProfileId: requesterProfileId,
  });

  if (!ownerLink || ownerLink.is_void === true) {
    throw new Error("Actor does not own this vport actor.");
  }

  return { ok: true, mode: "actor_owner", ownerLink };
}

export default assertActorOwnsVportActorController;
