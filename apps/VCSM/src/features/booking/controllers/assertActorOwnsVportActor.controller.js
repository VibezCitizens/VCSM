// COMPATIBILITY WRAPPER — IDENTITY-BOUNDARY-004
// ------------------------------------------------------------
// The live VPORT ownership authority has moved to features/authorization.
// This controller now delegates to the canonical gate. Behavior is preserved
// exactly: same args, step order, error messages, return shape, ownerLink raw
// row, and ELEK-004 kind-gate / self-shortcut safety — all owned by authorization.
// All existing consumers import the same symbol; nothing else changes.
//
// CARNAGE (DB AUDIT — unchanged, still open): inspect and remove the legacy
// owner_user_id branch from actor_can_manage_profile / actor_can_view_profile DB
// functions — migration 20260523020000 comment confirms it exists.
import { assertActorOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

/**
 * Assert that requestActorId owns targetActorId (VPORT ownership gate).
 *
 * Backward-compatible delegation to the canonical authorization gate.
 *
 * @param {{ requestActorId: string, targetActorId: string }} args
 * @returns {Promise<{ ok: true, mode: "self" | "actor_owner", ownerLink?: object }>}
 * @throws if ownership cannot be confirmed
 */
export async function assertActorOwnsVportActorController(args) {
  return assertActorOwnsActorController(args);
}

export default assertActorOwnsVportActorController;
