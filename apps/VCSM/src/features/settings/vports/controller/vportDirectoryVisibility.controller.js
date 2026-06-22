import { readVportDirectoryStateDAL } from "@/features/settings/vports/dal/vports.read.dal";
import {
  setVportDirectoryVisibleDAL,
  syncDirectoryVisibleToPublicDetailsDAL,
} from "@/features/settings/vports/dal/vports.write.dal";
import { checkVportOwnershipController } from "@/features/vportDashboard/adapters/vportDashboard.adapter";

// VPORT-DASHBOARD-OWNERSHIP-CONSISTENCY-001: this card now authorizes the active
// VPORT actor through the same vportDashboard ownership surface the gas dashboard
// uses (checkVportOwnershipController), instead of the booking.adapter ownership
// assertion. This grants the active VPORT-kind actor self-management (matching the
// gas card) and surfaces VPORT-safe wording instead of the booking-resource error.
const OWNERSHIP_DENIED_MESSAGE = "Only owners or managers can manage this VPORT.";

export async function ctrlGetVportDirectoryState({ vportId, callerActorId, vportActorId }) {
  if (!vportId) return null;
  if (!callerActorId) throw new Error("ctrlGetVportDirectoryState: callerActorId required");
  if (!vportActorId)  throw new Error("ctrlGetVportDirectoryState: vportActorId required");
  const isOwner = await checkVportOwnershipController({ callerActorId, targetActorId: vportActorId });
  if (!isOwner) throw new Error(OWNERSHIP_DENIED_MESSAGE);
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

  // Controller-layer ownership gate — same vportDashboard ownership surface the gas
  // dashboard uses. Grants the active VPORT actor (self) and user-kind owners; the
  // DAL still enforces owner_user_id = auth.uid() as defense-in-depth.
  const isOwner = await checkVportOwnershipController({ callerActorId, targetActorId: vportActorId });
  if (!isOwner) throw new Error(OWNERSHIP_DENIED_MESSAGE);

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
