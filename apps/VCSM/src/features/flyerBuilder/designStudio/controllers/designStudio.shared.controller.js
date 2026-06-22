import { dalReadAuthenticatedUserId } from "@/features/flyerBuilder/designStudio/dal/designStudio.auth.dal";
import {
  dalReadActorOwnerRow,
  dalReadDesignDocumentById,
} from "@/features/flyerBuilder/designStudio/dal/designStudio.read.dal";

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

export async function requireDesignDocumentOwnerAccess({ ownerActorId, documentId }) {
  await requireOwnerActorAccess(ownerActorId);
  if (!documentId) throw new Error("Document id is required.");

  const documentRow = await dalReadDesignDocumentById(documentId);
  if (!documentRow || documentRow.is_deleted) {
    throw new Error("Design document not found.");
  }

  if (String(documentRow.owner_actor_id) !== String(ownerActorId)) {
    throw new Error("Design document does not belong to this owner.");
  }

  return documentRow;
}
