// [VPORT_ONLY] — vport actor kind
import { readActorTypeDAL } from "@/features/profiles/dal/readActorType.dal";

// Delegates to the shared readActorTypeDAL cache (600s TTL).
// Returns the same shape as before: { kind, vport_type } or null.
export async function readVportTypeDAL(actorId) {
  if (!actorId) return null;
  return await readActorTypeDAL(actorId);
}
