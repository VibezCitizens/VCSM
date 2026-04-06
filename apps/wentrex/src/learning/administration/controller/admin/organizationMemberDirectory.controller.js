import { getOrganizationByIdDal } from "@/learning/administration/dal/organizations/getOrganizationById.dal";
import { listActiveActorsByUserIdsDal } from "@/learning/administration/dal/actors/listActiveActorsByUserIds.dal";
import { listActiveActorsByActorIdsDal } from "@/learning/administration/dal/actors/listActiveActorsByActorIds.dal";
import { searchProfilesByFieldDal } from "@/learning/administration/dal/profiles/searchProfilesByField.dal";
import { listProfilesByIdsDal } from "@/learning/administration/dal/profiles/listProfilesByIds.dal";
import {
  canManageOrganization,
  getOrganizationMembershipRow,
  isAdminAuthorized,
} from "@/learning/administration/controller/admin/adminAccess";

function normalizeText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sortProfiles(left, right) {
  const leftDisplayName = left.displayName?.toLowerCase() ?? "\uffff";
  const rightDisplayName = right.displayName?.toLowerCase() ?? "\uffff";

  if (leftDisplayName !== rightDisplayName) {
    return leftDisplayName.localeCompare(rightDisplayName);
  }

  const leftUsername = left.username?.toLowerCase() ?? "\uffff";
  const rightUsername = right.username?.toLowerCase() ?? "\uffff";

  if (leftUsername !== rightUsername) {
    return leftUsername.localeCompare(rightUsername);
  }

  const leftEmail = left.email?.toLowerCase() ?? "\uffff";
  const rightEmail = right.email?.toLowerCase() ?? "\uffff";

  return leftEmail.localeCompare(rightEmail);
}

async function assertOrganizationManager({
  supabase,
  userId,
  actorId,
  realmId,
  organizationId,
}) {
  const organizationRow = await getOrganizationByIdDal({
    supabase,
    organizationId,
  });

  if (!organizationRow || organizationRow.realm_id !== realmId) {
    return {
      ok: false,
      error: { code: "ORGANIZATION_NOT_FOUND" },
    };
  }

  const [organizationMembershipRow, isPlatformAdminActor] = await Promise.all([
    getOrganizationMembershipRow({
      supabase,
      organizationId,
      actorId,
    }),
    isAdminAuthorized({
      supabase,
      userId,
      actorId,
    }),
  ]);

  if (
    !canManageOrganization({
      actorId,
      organizationRow,
      organizationMembershipRow,
      isPlatformAdminActor,
    })
  ) {
    return {
      ok: false,
      error: { code: "FORBIDDEN" },
    };
  }

  return {
    ok: true,
    data: {
      organizationRow,
    },
  };
}

async function readProfilesMatchingQuery({ supabase, query }) {
  const pattern = `%${query}%`;

  const [displayNameRows, usernameRows, emailRows] = await Promise.all([
    searchProfilesByFieldDal({ supabase, field: "display_name", pattern, limit: 20 }),
    searchProfilesByFieldDal({ supabase, field: "username", pattern, limit: 20 }),
    searchProfilesByFieldDal({ supabase, field: "email", pattern, limit: 20 }),
  ]);

  const merged = new Map();

  for (const row of [...displayNameRows, ...usernameRows, ...emailRows]) {
    if (!row?.id || merged.has(row.id)) {
      continue;
    }

    merged.set(row.id, {
      profileId: row.id,
      displayName: normalizeText(row.display_name),
      username: normalizeText(row.username),
      email: normalizeText(row.email),
    });
  }

  return Array.from(merged.values()).sort(sortProfiles).slice(0, 20);
}


export async function hydrateOrganizationMemberProfiles({
  supabase,
  actorIds = [],
}) {
  const normalizedActorIds = Array.from(
    new Set(actorIds.filter((value) => typeof value === "string" && value.trim())),
  );

  if (!normalizedActorIds.length) {
    return new Map();
  }

  // Resolve user_ids from learning.actors (no longer via vc.actor_owners)
  const actorRows = await listActiveActorsByActorIdsDal({
    supabase,
    actorIds: normalizedActorIds,
  });

  const userIds = actorRows
    .map((row) => normalizeText(row.user_id))
    .filter(Boolean);

  const profileRows = await listProfilesByIdsDal({
    supabase,
    profileIds: userIds,
  });

  const profilesByUserId = new Map(
    (profileRows ?? []).map((row) => [
      row.id,
      {
        displayName: normalizeText(row.display_name),
        username: normalizeText(row.username),
        email: normalizeText(row.email),
      },
    ]),
  );

  const profilesByActorId = new Map();

  for (const actorRow of actorRows) {
    profilesByActorId.set(
      actorRow.id,
      profilesByUserId.get(actorRow.user_id) ?? {
        displayName: null,
        username: null,
        email: null,
      },
    );
  }

  return profilesByActorId;
}

export async function searchOrganizationMemberCandidatesController({
  supabase,
  userId,
  actorId,
  realmId,
  organizationId,
  query,
}) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return {
      ok: true,
      data: {
        results: [],
      },
    };
  }

  const access = await assertOrganizationManager({
    supabase,
    userId,
    actorId,
    realmId,
    organizationId,
  });

  if (!access.ok) {
    return access;
  }

  const profiles = await readProfilesMatchingQuery({
    supabase,
    query: normalizedQuery,
  });

  // Identity resolution: map user_id -> learning actor_id via learning.actors
  // (no longer via vc.actor_owners)
  const actorRows = await listActiveActorsByUserIdsDal({
    supabase,
    userIds: profiles.map((profile) => profile.profileId),
  });

  const actorByUserId = new Map(
    actorRows.map((row) => [row.user_id, row.id]),
  );

  return {
    ok: true,
    data: {
      results: profiles
        .filter((profile) => actorByUserId.has(profile.profileId))
        .map((profile) => ({
          actorId: actorByUserId.get(profile.profileId),
          displayName: profile.displayName,
          username: profile.username,
          email: profile.email,
        })),
    },
  };
}

export default searchOrganizationMemberCandidatesController;
