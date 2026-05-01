import { getOrganizationByIdDal } from "@/learning/dal/organizations/getOrganizationById.dal";

import { mapOrganization } from "@/learning/model/organization.model";
import {
  canManageOrganization,
  getOrganizationMembershipRow,
  isPlatformAdmin,
  listOrganizationMembershipRowsForActor,
  normalizeMembershipStatus,
  normalizeOrganizationRole,
  saveOrganizationMembership,
} from "@/learning/controller/administration/adminAccess.controller";

function mapOrganizationMembershipRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organizationId: row.organization_id,
    actorId: row.actor_id,
    role: row.role,
    status: row.status,
    createdByActorId: row.created_by_actor_id,
    createdAt: row.created_at,
  };
}

export async function assignOrganizationMemberController({
  supabase,
  actorId,
  realmId,
  organizationId,
  memberActorId,
  role = "staff",
  status = "active",
}) {
  const organizationRow = await getOrganizationByIdDal({
    supabase,
    organizationId,
  });

  if (!organizationRow || organizationRow.realm_id !== realmId) {
    return { ok: false, error: { code: "ORGANIZATION_NOT_FOUND" } };
  }

  if (!memberActorId) {
    return { ok: false, error: { code: "MEMBER_ACTOR_ID_REQUIRED" } };
  }

  const [actorOrganizationMembershipRow, isPlatformAdminActor, existingMembershipRows] =
    await Promise.all([
      getOrganizationMembershipRow({
        supabase,
        organizationId,
        actorId,
      }),
      isPlatformAdmin({
        supabase,
        actorId,
      }),
      listOrganizationMembershipRowsForActor({
        supabase,
        organizationId,
        actorId: memberActorId,
      }),
    ]);

  if (
    !canManageOrganization({
      actorId,
      organizationRow,
      organizationMembershipRow: actorOrganizationMembershipRow,
      isPlatformAdminActor,
    })
  ) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const nextRole = normalizeOrganizationRole(role);
  const nextStatus = normalizeMembershipStatus(status);
  const membershipRow = await saveOrganizationMembership({
    supabase,
    existingMembershipRow:
      existingMembershipRows.find((row) => row.role === nextRole) ??
      existingMembershipRows[0] ??
      null,
    organizationId,
    memberActorId,
    role: nextRole,
    status: nextStatus,
    createdByActorId: actorId,
  });

  return {
    ok: true,
    data: {
      organization: mapOrganization(organizationRow),
      membership: mapOrganizationMembershipRow(membershipRow),
    },
  };
}

export default assignOrganizationMemberController;
