import { checkActorOwnershipDAL } from "@/features/profiles/dal/checkActorOwnership.dal";

export async function checkActorOwnershipController({ userId, actorId }) {
  return checkActorOwnershipDAL({ userId, actorId });
}
