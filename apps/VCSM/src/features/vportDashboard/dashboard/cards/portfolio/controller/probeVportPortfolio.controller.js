import { readVportProfileByActorIdDAL } from "@/features/vportDashboard/dal/read/vportProfile.read.dal";
import { readVportProfileActorAccessDAL } from "@/features/vportDashboard/dal/read/vportProfileActorAccess.read.dal";
import { readActorOwnersByActorIdDAL } from "@/features/vportDashboard/dal/read/actorOwners.read.dal";
import { assertSessionOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';

export async function probeVportPortfolioController({ actorId, identity, userId }) {
  try {
    if (!actorId) throw new Error("[probeVportPortfolio] actorId required");
    if (!identity?.actorId) throw new Error("[probeVportPortfolio] identity required");

    // Session-derived ownership (IDENTITY-BOUNDARY-006 / ELEK-004): the active actor is
    // the VPORT itself, so ownership is resolved from the auth session via actor_owners
    // rather than trusting identity.actorId from the UI.
    await assertSessionOwnsVportActorController({ targetActorId: actorId });

    const result = {};

    result.identity = {
      actorId: identity?.actorId ?? null,
      kind: identity?.kind ?? null,
      vportType: identity?.vportType ?? null,
    };

    const profileRow = await readVportProfileByActorIdDAL({ actorId });
    result.profileLookup = { actorId, row: profileRow ?? null, error: null };

    const profileId = profileRow?.id ?? null;
    result.resolvedProfileId = profileId;

    if (profileId) {
      const accessRows = await readVportProfileActorAccessDAL({ profileId });
      result.profileActorAccess = {
        rows: accessRows,
        error: null,
        activeActorFound: accessRows.some((r) => r.actor_id === actorId),
      };
    } else {
      result.profileActorAccess = null;
    }

    const ownerRows = await readActorOwnersByActorIdDAL({ actorId });
    result.actorOwners = { rows: ownerRows, error: null };

    result.session = { userId: userId ?? null };

    result.expectedInsertPayload = {
      profile_id: profileId,
      created_by_actor_id: null,
      title: "(test title)",
      portfolio_kind: "work",
      visibility: "public",
    };

    const assertions = [];
    assertions.push({ label: "actorId present", pass: !!actorId, value: actorId });
    assertions.push({ label: "identity.kind === vport", pass: identity?.kind === "vport", value: identity?.kind });
    assertions.push({ label: "profileId resolved", pass: !!profileId, value: profileId ?? "NO PROFILE FOUND for actor" });
    if (profileId) {
      assertions.push({ label: "profile.actor_id matches actorId", pass: profileRow?.actor_id === actorId, got: profileRow?.actor_id });
      assertions.push({ label: "profile not deleted", pass: !profileRow?.is_deleted });
    }
    result.assertions = assertions;

    return result;
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'portfolio.probeVportPortfolio.controller', severity: 'error', message: `probeVportPortfolioController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'probeVportPortfolio', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}
