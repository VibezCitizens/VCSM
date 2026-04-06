import { getAuthUserDal } from "@/learning/administration/dal/auth/getAuthUser.dal";
import { getActorAccessDal } from "@/learning/administration/dal/actorAccess/getActorAccess.dal";
import { listActiveOrgMembershipsByActorRolesDal } from "@/learning/administration/dal/memberships/listActiveOrgMembershipsByActorRoles.dal";
import { listOrganizationsByIdsDal } from "@/learning/administration/dal/organizations/listOrganizationsByIds.dal";
import { listRealmsByIdsDal } from "@/learning/administration/dal/realms/listRealmsByIds.dal";
import { resolveLearningActor } from "@/learning/administration/adapters/actor.adapter";

const DEBUG_PREFIX = "[resolveAdminEntry]";

function mapMemberships({ membershipRows, organizationMap, realmMap }) {
  return membershipRows.map((row) => {
    const organization = organizationMap.get(row.organization_id) ?? null;
    const realm = organization?.realm_id
      ? realmMap.get(organization.realm_id) ?? null
      : null;

    return {
      organizationId: row.organization_id,
      role: row.role,
      status: "active",
      createdAt: row.created_at,
      organizationName: organization?.name ?? "Organization",
      organizationSlug: organization?.slug ?? null,
      organizationIsActive: organization?.is_active ?? null,
      realmId: organization?.realm_id ?? null,
      realmName: realm?.name ?? null,
      realmSlug: realm?.slug ?? null,
      realmIsActive: realm?.is_active ?? null,
    };
  });
}

function findFirstRoutableMembership(memberships) {
  return (
    memberships.find((m) => m.role === "admin" && m.realmSlug) ??
    memberships.find((m) => m.role === "staff" && m.realmSlug) ??
    null
  );
}

export async function resolveAdminEntryController({ supabase }) {
  console.group(`${DEBUG_PREFIX} resolveAdminEntryState`);

  // 1. Auth user
  const user = await getAuthUserDal({ supabase });
  console.log("1. auth user", {
    userId: user?.id ?? null,
    email: user?.email ?? null,
  });

  if (!user) {
    console.warn("1. no signed-in user; returning anonymous state");
    console.groupEnd();
    return {
      ok: true,
      data: { kind: "anonymous", user: null, actorId: null, memberships: [] },
    };
  }

  // 2. Resolve actor
  const actorResult = await resolveLearningActor({ supabase, user });
  const actorId = actorResult?.ok ? actorResult.data.actorId : null;
  console.log("2. resolved actor", { actorResult, actorId });

  if (!actorId) {
    console.warn("2. actor could not be resolved; returning missing-actor state");
    console.groupEnd();
    return {
      ok: true,
      data: { kind: "missing-actor", user, actorId: null, memberships: [] },
    };
  }

  // 3. Access + memberships in parallel
  const [accessRow, membershipRows] = await Promise.all([
    getActorAccessDal({ supabase, actorId }),
    listActiveOrgMembershipsByActorRolesDal({
      supabase,
      actorId,
      roles: ["admin", "staff"],
    }),
  ]);

  const hasLearningAccess = accessRow?.can_access_learning_center === true;
  console.log("3. actor access + organization memberships", {
    actorId,
    hasLearningAccess,
    membershipRows,
  });

  // 4. Resolve organizations and realms
  const organizationIds = [
    ...new Set(membershipRows.map((r) => r.organization_id).filter(Boolean)),
  ];
  const organizations = await listOrganizationsByIdsDal({
    supabase,
    organizationIds,
  });
  const realmIds = [
    ...new Set(organizations.map((r) => r.realm_id).filter(Boolean)),
  ];
  const realms = await listRealmsByIdsDal({ supabase, realmIds });
  console.log("4. linked organizations + realms", {
    organizationIds,
    organizations,
    realmIds,
    realms,
  });

  // 5. Map memberships
  const organizationMap = new Map(organizations.map((r) => [r.id, r]));
  const realmMap = new Map(realms.map((r) => [r.id, r]));

  const memberships = mapMemberships({
    membershipRows,
    organizationMap,
    realmMap,
  });
  console.log("5. mapped memberships", memberships);

  // 6. Find routable membership
  const firstRoutable = findFirstRoutableMembership(memberships);
  console.log("6. first routable membership", firstRoutable);

  if (firstRoutable) {
    const path = `/learning/${firstRoutable.realmSlug}/${firstRoutable.role === "admin" ? "admin" : "teacher"}`;
    console.log("7. returning redirect state", { kind: "redirect", path });
    console.groupEnd();
    return {
      ok: true,
      data: { kind: "redirect", user, actorId, memberships, path },
    };
  }

  if (memberships.length > 0) {
    console.warn("7. admin membership exists but no realm route could be built");
    console.groupEnd();
    return {
      ok: true,
      data: {
        kind: "admin-pending",
        user,
        actorId,
        memberships,
        hasLearningAccess,
      },
    };
  }

  if (hasLearningAccess) {
    console.warn(
      "7. actor is authorized via learning access but has no active org admin/staff membership",
    );
    console.groupEnd();
    return {
      ok: true,
      data: {
        kind: "authorized-no-admin-route",
        user,
        actorId,
        memberships: [],
        hasLearningAccess,
      },
    };
  }

  console.warn("7. actor is not authorized for admin entry");
  console.groupEnd();
  return {
    ok: true,
    data: {
      kind: "unauthorized",
      user,
      actorId,
      memberships: [],
      hasLearningAccess,
    },
  };
}

export default resolveAdminEntryController;
