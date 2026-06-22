// [SHARED_ACTOR_PRIMITIVE] — serves both citizen and vport actor kinds
import { readActorTypeDAL } from "@/features/profiles/dal/readActorType.dal";

// Delegates to the shared readActorTypeDAL cache (600s TTL).
// Returns the same shape as before: { kind } or null.
export async function readActorKindDAL(actorId) {
  if (!actorId) return null;
  const result = await readActorTypeDAL(actorId);
  return result ? { kind: result.kind } : null;
}
