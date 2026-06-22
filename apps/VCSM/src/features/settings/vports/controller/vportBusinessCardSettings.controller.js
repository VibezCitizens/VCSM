import { readVportBusinessCardSettingsDAL } from "@/features/settings/vports/dal/vports.read.dal";
import { setVportBusinessCardSettingsDAL } from "@/features/settings/vports/dal/vports.write.dal";
import { checkVportOwnershipController } from "@/features/vportDashboard/adapters/vportDashboard.adapter";

// VPORT-DASHBOARD-OWNERSHIP-CONSISTENCY-001: this card now authorizes the active
// VPORT actor through the same vportDashboard ownership surface the gas dashboard
// uses (checkVportOwnershipController), instead of the booking.adapter ownership
// assertion. This grants the active VPORT-kind actor self-management (matching the
// gas card) and surfaces VPORT-safe wording instead of the booking-resource error.
const OWNERSHIP_DENIED_MESSAGE = "Only owners or managers can manage this VPORT.";

export async function ctrlGetVportBusinessCardSettings({ vportId, callerActorId, vportActorId }) {
  if (!vportId) return null;
  if (!callerActorId) throw new Error("ctrlGetVportBusinessCardSettings: callerActorId required");
  if (!vportActorId)  throw new Error("ctrlGetVportBusinessCardSettings: vportActorId required");
  const isOwner = await checkVportOwnershipController({ callerActorId, targetActorId: vportActorId });
  if (!isOwner) throw new Error(OWNERSHIP_DENIED_MESSAGE);
  return readVportBusinessCardSettingsDAL(vportId);
}

/**
 * Save business_card_settings for a vport.
 *
 * VPD-V-FIX-001: Actor-layer ownership gate added to match the authorization
 * depth of ctrlSetVportDirectoryVisible. Previously relied only on the DAL-level
 * owner_user_id = auth.uid() guard. Now also verifies actor_owners membership.
 * DAL-level guard is preserved as defense-in-depth.
 *
 * @param {object} params
 * @param {string} params.vportId       - The vport.profiles row id
 * @param {object} params.settings      - Full merged settings object
 * @param {string} params.callerActorId - The authenticated caller's actorId
 * @param {string} params.vportActorId  - The VPORT's actorId (for ownership gate)
 */
export async function ctrlSetVportBusinessCardSettings({ vportId, settings, callerActorId, vportActorId }) {
  if (!vportId)       throw new Error("ctrlSetVportBusinessCardSettings: vportId required");
  if (!callerActorId) throw new Error("ctrlSetVportBusinessCardSettings: callerActorId required");
  if (!vportActorId)  throw new Error("ctrlSetVportBusinessCardSettings: vportActorId required");
  if (!settings || typeof settings !== "object") throw new Error("ctrlSetVportBusinessCardSettings: settings required");

  // Controller-layer ownership gate — mirrors the guard in ctrlSetVportDirectoryVisible.
  const isOwner = await checkVportOwnershipController({ callerActorId, targetActorId: vportActorId });
  if (!isOwner) throw new Error(OWNERSHIP_DENIED_MESSAGE);

  return setVportBusinessCardSettingsDAL(vportId, settings);
}
