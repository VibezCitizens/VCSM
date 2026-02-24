import { dalReadAuthenticatedUserId } from "@/features/dashboard/flyerBuilder/designStudio/dal/designStudio.auth.dal";
import { dalReadActorOwnerRow } from "@/features/dashboard/flyerBuilder/designStudio/dal/designStudio.read.dal";

export async function requireOwnerActorAccess(ownerActorId) {
  const userId = await dalReadAuthenticatedUserId();
  if (!userId) throw new Error("Sign in required.");

  const ownerRow = await dalReadActorOwnerRow({
    actorId: ownerActorId,
    userId,
  });

  if (!ownerRow) {
    throw new Error("You do not have access to this VPORT design studio.");
  }

  return userId;
}
