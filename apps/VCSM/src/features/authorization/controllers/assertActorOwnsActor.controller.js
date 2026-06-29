import { captureVcsmError } from "@/services/monitoring/vcsmMonitoring";
import { readActorByIdDAL } from "@/features/authorization/dal/actors.read.dal";
import { readOwnerLinkByProfileDAL } from "@/features/authorization/dal/actorOwners.read.dal";
import { buildSelfDecision } from "@/features/authorization/model/authorizationDecision.model";
import { readCurrentAuthUser } from "@/features/auth/adapters/authSession.adapter";

// Step order is load-bearing:
//   1. Requester actor lookup  — unconditional, runs before self-shortcut
//   2. Kind gate               — unconditional, must precede self-shortcut
//   2.5 Session bind (V02-H1)  — unconditional, must precede self-shortcut AND owner path
//   3. Self-ownership shortcut — fires only after kind + session bind are confirmed
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

  // Step 2.5 — Session binding (V02-H1).
  // The caller-supplied requestActorId must belong to the authenticated session
  // before EITHER the self-shortcut or the actor_owners path can succeed. For a
  // user-kind actor (confirmed above), vc.actors.profile_id equals the Supabase
  // auth UUID (auth.getUser().id), so requiring requesterActor.profile_id === the
  // session user id proves the caller actually controls requestActorId. This closes
  // the zero-check self-shortcut and removes the owner path's reliance on a
  // caller-supplied profile. Session is read via the approved auth adapter
  // (Supabase is forbidden in controllers/DALs; the auth adapter is the only home).
  const sessionUser = await readCurrentAuthUser();
  if (!sessionUser) throw new Error("No authenticated session.");
  if (String(requesterActor.profile_id ?? "") !== String(sessionUser.id)) {
    captureVcsmError({
      feature: "authorization",
      module: "assertActorOwnsActor.controller",
      behavior_id: "behavior.authorization.ownership_gate",
      severity: "warning",
      message: "assertActorOwnsActorController: requester actor not bound to the authenticated session — session bind rejected",
      operation: "sessionBindCheck",
      is_handled: true,
      context: { ownershipMode: null },
    });
    throw new Error("Requester actor is not bound to the authenticated session.");
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
