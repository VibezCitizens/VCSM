// COMPATIBILITY WRAPPER — IDENTITY-BOUNDARY-004
// ------------------------------------------------------------
// Session-derived VPORT ownership authority has moved to features/authorization.
// This controller now delegates to the canonical session gate. Behavior is
// preserved exactly: same args, step order, error messages, and return shape.
// Identity Contract §1.3: caller identity is derived from the Supabase auth
// session, never passed from the UI.
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

/**
 * Assert the authenticated session user owns targetActorId (VPORT-only).
 *
 * Backward-compatible delegation to the canonical authorization session gate.
 *
 * @param {{ targetActorId: string }} args
 * @returns {Promise<{ ok: true }>}
 * @throws if target is unavailable, wrong kind, or session does not own it
 */
export async function assertSessionOwnsVportActorController(args) {
  return assertSessionOwnsActorController(args);
}

export default assertSessionOwnsVportActorController;
