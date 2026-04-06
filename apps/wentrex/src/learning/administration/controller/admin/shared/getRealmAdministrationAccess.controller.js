import { isAdminAuthorized } from "@/learning/administration/controller/admin/shared/adminAuth.controller";
import { hasActiveAdminRole } from "@/learning/administration/controller/admin/shared/adminRoles.controller";
import { listOrganizationMembershipRows } from "@/learning/administration/controller/admin/shared/adminMemberships.controller";

export async function getRealmAdministrationAccess({
  supabase,
  userId,
  actorId,
  organizations = [],
}) {
  if (!actorId) {
    return {
      allowed: false,
      isPlatformAdminActor: false,
      ownedOrganizationIds: [],
      adminMemberships: [],
    };
  }

  const isPlatformAdminActor = await isAdminAuthorized({ supabase, userId, actorId });
  const ownedOrganizationIds = organizations
    .filter((organizationRow) => organizationRow.owner_actor_id === actorId)
    .map((organizationRow) => organizationRow.id);

  const adminMemberships = [];

  for (const organizationRow of organizations) {
    const membershipRows = await listOrganizationMembershipRows({
      supabase,
      organizationId: organizationRow.id,
    });

    const adminMembership = membershipRows.find(
      (membershipRow) =>
        membershipRow.actor_id === actorId &&
        hasActiveAdminRole(membershipRow),
    );

    if (adminMembership) {
      adminMemberships.push({
        organizationId: organizationRow.id,
        membershipId: adminMembership.id,
        role: adminMembership.role,
        status: adminMembership.status,
      });
    }
  }

  const allowed =
    isPlatformAdminActor ||
    ownedOrganizationIds.length > 0 ||
    adminMemberships.length > 0;

  console.log("[getRealmAdministrationAccess] permission inputs", {
    actorId,
    isPlatformAdminActor,
    ownedOrganizationIds,
    adminMemberships,
    organizationsInRealm: organizations.map((o) => ({
      id: o.id,
      ownerActorId: o.owner_actor_id ?? null,
    })),
  });
  console.log("[getRealmAdministrationAccess] final allowed:", allowed);

  return {
    allowed,
    isPlatformAdminActor,
    ownedOrganizationIds,
    adminMemberships,
  };
}
