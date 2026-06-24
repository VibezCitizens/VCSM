import { readActorByIdDAL } from "@/features/authorization/dal/actors.read.dal";

// Minimal actor kind/void read for authorization-adjacent navigation/visibility
// gates (e.g. a VPORT actor viewing its own dashboard). Read-only — performs no
// ownership decision. Ownership assertions remain owned by the assert*Controllers.

/**
 * Read minimal status (kind + void) for a single actor.
 *
 * @param {{ actorId: string }} params
 * @returns {Promise<{ kind: string|null, isVoid: boolean } | null>} null if actorId missing or actor not found
 */
export async function readActorStatusController({ actorId } = {}) {
  if (!actorId) return null;
  const actor = await readActorByIdDAL({ actorId });
  if (!actor) return null;
  return { kind: actor.kind ?? null, isVoid: actor.is_void === true };
}

export default readActorStatusController;
