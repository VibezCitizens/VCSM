import { readVportProfileByActorIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import { readVportProfileActorAccessDAL } from "@/features/dashboard/vport/dal/read/vportProfileActorAccess.read.dal";
import { readActorOwnersByActorIdDAL } from "@/features/dashboard/vport/dal/read/actorOwners.read.dal";

export async function probeVportPortfolioController({ actorId, identity, userId, email }) {
  const result = {};

  result.identity = {
    actorId: identity?.actorId ?? null,
    kind: identity?.kind ?? null,
    vportType: identity?.vportType ?? null,
    ownerActorId: identity?.ownerActorId ?? null,
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

  result.session = { userId: userId ?? null, email: email ?? null };

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
}
