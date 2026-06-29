import { readVportBusinessCardSettingsDAL } from "@/features/settings/vports/dal/vports.read.dal";
import { setVportBusinessCardSettingsDAL } from "@/features/settings/vports/dal/vports.write.dal";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

// V12A-M2 (TICKET-SETTINGS-VPORT-CANONICAL-OWNERBIND-001): authorize VPORT settings
// reads/mutations through the canonical session-derived ownership gate
// (assertSessionOwnsActorController), replacing the navigation-grade hybrid
// checkVportOwnershipController whose self-grant path (V03A-H2 lineage) accepted a
// caller-supplied actorId equality as proof of ownership. The canonical gate resolves
// ownership from the Supabase auth session → vc.actor_owners → target VPORT and never
// trusts caller-supplied ids, so the self-grant is structurally unreachable.
// Legitimate user-owner and active-vport self-management are preserved. DiD only;
// durable boundary = vport.profiles RLS (12A-DB-2, Phase 15). callerActorId is retained
// (vestigial) for signature stability; ownership no longer depends on it.
const OWNERSHIP_DENIED_MESSAGE = "Only owners or managers can manage this VPORT.";

export async function ctrlGetVportBusinessCardSettings({ vportId, callerActorId, vportActorId }) {
  if (!vportId) return null;
  if (!callerActorId) throw new Error("ctrlGetVportBusinessCardSettings: callerActorId required");
  if (!vportActorId)  throw new Error("ctrlGetVportBusinessCardSettings: vportActorId required");
  try {
    await assertSessionOwnsActorController({ targetActorId: vportActorId });
  } catch {
    throw new Error(OWNERSHIP_DENIED_MESSAGE);
  }
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

  // V12A-M2: canonical session-derived ownership gate (mirrors ctrlSetVportDirectoryVisible).
  try {
    await assertSessionOwnsActorController({ targetActorId: vportActorId });
  } catch {
    throw new Error(OWNERSHIP_DENIED_MESSAGE);
  }

  return setVportBusinessCardSettingsDAL(vportId, settings);
}
