import { captureVcsmError } from "@/services/monitoring/vcsmMonitoring";
import { readActorByIdDAL } from "@/features/authorization/dal/actors.read.dal";
import { readOwnerLinkByProfileDAL } from "@/features/authorization/dal/actorOwners.read.dal";
import { buildSelfDecision } from "@/features/authorization/model/authorizationDecision.model";

// Step order is load-bearing:
//   1. Requester actor lookup  — unconditional, runs before self-shortcut
//   2. Kind gate               — unconditional, must precede self-shortcut
//   3. Self-ownership shortcut — fires only after kind is confirmed
//   4. Profile identity check  — required before DB ownership query
//   5. actor_owners DB check   — ownership verification
//   6. Target actor validation — confirms target exists and is live
//
// ELEK-004 compliance: kind check is unconditional and precedes the self-shortcut.
// A VPORT-kind actor with requestActorId === targetActorId must not bypass the kind gate.

/**
 * Assert that requestActorId owns targetActorId.
 *
 * Ownership is verified via vc.actor_owners when the actors differ.
 * User-kind actors managing their own actor ID skip the DB query (self-shortcut).
 *
 * @param {{ requestActorId: string, targetActorId: string }} params
 * @returns {Promise<{ ok: true, mode: "self" | "actor_owner", ownerLink?: object }>}
 * @throws if ownership cannot be confirmed
 */
export async function assertActorOwnsActorController({ requestActorId, targetActorId } = {}) {
  if (!requestActorId) throw new Error("assertActorOwnsActorController: requestActorId is required");
  if (!targetActorId)  throw new Error("assertActorOwnsActorController: targetActorId is required");

  // Step 1 — Requester actor lookup (unconditional).
  const requesterActor = await readActorByIdDAL({ actorId: requestActorId });
  if (!requesterActor || requesterActor.is_void === true) {
    throw new Error("Requester actor not found.");
  }

  // Step 2 — Kind gate (unconditional).
  if (requesterActor.kind !== "user") {
    captureVcsmError({
      feature: "authorization",
      module: "assertActorOwnsActor.controller",
      behavior_id: "behavior.authorization.ownership_gate",
      severity: "warning",
      message: "assertActorOwnsActorController: non-user actor attempted ownership operation — kind gate rejected",
      operation: "actorKindCheck",
      is_handled: true,
      context: { actorKind: requesterActor.kind ?? null, ownershipMode: null },
    });
    throw new Error("Only actor owners can manage this booking resource.");
  }

  // Step 3 — Self-ownership shortcut.
  // Safe here because kind === "user" is already confirmed above.
  // Skips the actor_owners DB query for user actors managing their own resource.
  if (String(requestActorId) === String(targetActorId)) {
    return buildSelfDecision();
  }

  // Step 4 — Profile identity required for actor_owners query.
  const userProfileId = requesterActor.profile_id ?? null;
  if (!userProfileId) {
    throw new Error("Requester actor is missing profile ownership identity.");
  }

  // Step 5 — actor_owners DB verification.
  const ownerLink = await readOwnerLinkByProfileDAL({ targetActorId, userProfileId });
  if (!ownerLink || ownerLink.is_void === true) {
    captureVcsmError({
      feature: "authorization",
      module: "assertActorOwnsActor.controller",
      behavior_id: "behavior.authorization.ownership_gate",
      severity: "warning",
      message: "assertActorOwnsActorController: actor_owners link not found — ownership denied",
      operation: "readOwnerLinkByProfileDAL",
      is_handled: true,
      context: { ownerLinkFound: false, ownershipMode: "actor_owner" },
    });
    throw new Error("Actor does not own this vport actor.");
  }

  // Step 6 — Target actor validation.
  const targetActor = await readActorByIdDAL({ actorId: targetActorId });
  if (!targetActor || targetActor.is_void === true) {
    throw new Error("Target vport actor is not available.");
  }

  return { ok: true, mode: "actor_owner", ownerLink };
}

export default assertActorOwnsActorController;
