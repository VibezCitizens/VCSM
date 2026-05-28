import getActorByIdDAL from "@/features/booking/dal/getActorById.dal";
import readActorOwnerLinkByActorAndUserProfileDAL from "@/features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal";

// CARNAGE: inspect and remove the legacy owner_user_id branch from actor_can_manage_profile
// and actor_can_view_profile DB functions — migration 20260523020000 comment confirms it exists.

// ELEK-004: actor lookup and kind validation run unconditionally — before the self-shortcut.
// Previously the self-shortcut at line 15 fired before the kind check, allowing a VPORT-kind
// actor with requestActorId === targetActorId to bypass the kind gate and the actor_owners DB
// query entirely. Kind must be verified first; only then may the self-shortcut apply.
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

  // Always validate requester actor — kind check is unconditional and precedes self-shortcut.
  const requesterActor = await getActorByIdDAL({ actorId: requestActorId });
  if (!requesterActor || requesterActor.is_void === true) {
    throw new Error("Requester actor not found.");
  }

  if (requesterActor.kind !== "user") {
    throw new Error("Only actor owners can manage this booking resource.");
  }

  // Self-ownership shortcut: safe here because kind === "user" is already confirmed above.
  // Skips the actor_owners DB query — valid only for user-kind actors managing their own resource.
  if (String(requestActorId) === String(targetActorId)) {
    return { ok: true, mode: "self" };
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

  const targetActor = await getActorByIdDAL({ actorId: targetActorId });
  if (!targetActor || targetActor.is_void === true) {
    throw new Error("Target vport actor is not available.");
  }

  return { ok: true, mode: "actor_owner", ownerLink };
}

export default assertActorOwnsVportActorController;
