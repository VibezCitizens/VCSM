import { readVportDirectoryStateDAL } from "@/features/settings/vports/dal/vports.read.dal";
import {
  setVportDirectoryVisibleDAL,
  syncDirectoryVisibleToPublicDetailsDAL,
} from "@/features/settings/vports/dal/vports.write.dal";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

// V12A-M2 (TICKET-SETTINGS-VPORT-CANONICAL-OWNERBIND-001): authorize VPORT settings
// reads/mutations through the canonical session-derived ownership gate
// (assertSessionOwnsActorController), replacing the navigation-grade hybrid
// checkVportOwnershipController whose self-grant path (V03A-H2 lineage) accepted a
// caller-supplied actorId equality as proof of ownership. The canonical gate never
// trusts caller-supplied ids — it resolves ownership from the Supabase auth session
// → vc.actor_owners → target VPORT — so the self-grant is structurally unreachable.
// Legitimate user-owner and active-vport self-management both resolve to "session
// owns target vport" and are preserved. DiD only; durable boundary = vport.profiles
// RLS (12A-DB-2/3, Phase 15). callerActorId is retained (vestigial) for signature
// stability; ownership no longer depends on it.
const OWNERSHIP_DENIED_MESSAGE = "Only owners or managers can manage this VPORT.";

export async function ctrlGetVportDirectoryState({ vportId, callerActorId, vportActorId }) {
  if (!vportId) return null;
  if (!callerActorId) throw new Error("ctrlGetVportDirectoryState: callerActorId required");
  if (!vportActorId)  throw new Error("ctrlGetVportDirectoryState: vportActorId required");
  try {
    await assertSessionOwnsActorController({ targetActorId: vportActorId });
  } catch {
    throw new Error(OWNERSHIP_DENIED_MESSAGE);
  }
  return readVportDirectoryStateDAL(vportId);
}

/**
 * Toggle directory visibility for a VPORT.
 *
 * VPD-V-026: The controller now enforces actor ownership at the controller layer
 * before delegating to the DAL. The DAL still enforces owner_user_id = auth.uid()
 * as a defense-in-depth secondary check.
 *
 * @param {object} params
 * @param {string} params.vportId      - The vport.profiles row id (profileId)
 * @param {boolean} params.visible     - The desired visibility state
 * @param {string} params.callerActorId - The authenticated caller's actorId
 * @param {string} params.vportActorId  - The VPORT's actorId (for ownership gate)
 */
export async function ctrlSetVportDirectoryVisible({ vportId, visible, callerActorId, vportActorId }) {
  if (!vportId)       throw new Error("vportId required");
  if (!callerActorId) throw new Error("ctrlSetVportDirectoryVisible: callerActorId required");
  if (!vportActorId)  throw new Error("ctrlSetVportDirectoryVisible: vportActorId required");

  // V12A-M2: canonical session-derived ownership gate. Grants the active VPORT actor
  // (self) and user-kind owners via the auth session → vc.actor_owners → target VPORT;
  // the DAL still enforces owner_user_id = auth.uid() as defense-in-depth.
  try {
    await assertSessionOwnsActorController({ targetActorId: vportActorId });
  } catch {
    throw new Error(OWNERSHIP_DENIED_MESSAGE);
  }

  const result = await setVportDirectoryVisibleDAL(vportId, Boolean(visible));

  // VPD-V-FIX-002: Non-critical secondary sync moved from DAL to controller layer.
  // vport.profiles is authoritative. Failure here is non-blocking but logged
  // so drift between tables is visible in monitoring.
  try {
    await syncDirectoryVisibleToPublicDetailsDAL(vportId, Boolean(visible));
  } catch (syncErr) {
    console.warn(
      "[ctrlSetVportDirectoryVisible] profile_public_details sync failed (non-blocking):",
      syncErr?.message ?? syncErr
    );
  }

  return result;
}
