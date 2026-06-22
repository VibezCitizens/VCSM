import { readActorByIdDAL } from "@/features/authorization/dal/actors.read.dal";
import { readOwnerLinkBySessionDAL } from "@/features/authorization/dal/actorOwners.read.dal";

// Identity Contract §1.3: the UI identity surface exposes only actorId + kind.
// This controller exists so self-read operations never require callerActorId from the UI.
// Caller identity is derived entirely from the Supabase auth session.
//
// Use for operations where a VPORT actor is the only permitted caller for its own data.
// For actor-to-actor delegation (does user X own VPORT Y?) use assertActorOwnsActorController.

/**
 * Assert that the authenticated session user owns targetActorId.
 *
 * Caller identity is never passed in — resolved from the Supabase auth session:
 *   getUser() → auth UUID → profiles.id → actor_owners.user_id
 *
 * targetActorId must be a VPORT-kind actor. User-kind self-reads do not
 * use this gate — use assertActorOwnsActorController (self-shortcut applies).
 *
 * @param {{ targetActorId: string }} params
 * @returns {Promise<{ ok: true }>}
 * @throws if target is unavailable, wrong kind, or session does not own it
 */
export async function assertSessionOwnsActorController({ targetActorId } = {}) {
  if (!targetActorId) throw new Error("assertSessionOwnsActorController: targetActorId is required");

  // Target actor must exist and be live.
  const targetActor = await readActorByIdDAL({ actorId: targetActorId });
  if (!targetActor || targetActor.is_void === true) {
    throw new Error("Target vport actor is not available.");
  }

  // This gate is VPORT-only — user actors use assertActorOwnsActorController.
  if (targetActor.kind !== "vport") {
    throw new Error("Target actor is not a vport.");
  }

  // Session-derived ownership check.
  const ownerLink = await readOwnerLinkBySessionDAL({ targetActorId });
  if (!ownerLink || ownerLink.is_void === true) {
    throw new Error("Session user does not own this vport actor.");
  }

  return { ok: true };
}

export default assertSessionOwnsActorController;
