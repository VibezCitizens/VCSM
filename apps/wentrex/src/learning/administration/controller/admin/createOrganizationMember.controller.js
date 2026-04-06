import { createOrgMember } from "@/services/supabase/createOrgMember";
import { getOrganizationByIdDal } from "@/learning/administration/dal/organizations/getOrganizationById.dal";
import {
  canManageOrganization,
  getOrganizationMembershipRow,
  isAdminAuthorized,
} from "@/learning/administration/controller/admin/adminAccess";

/**
 * Create a new organization member (staff/teacher/admin account).
 *
 * Auth checks:
 *   - Organization must exist in caller's realm
 *   - Caller must be org owner, org admin, or platform admin
 */
export async function createOrganizationMemberController({
  supabase,
  userId,
  actorId,
  realmId,
  organizationId,
  displayName,
  email,
  username = null,
  role = "staff",
  status = "active",
}) {
  if (!organizationId || !displayName || !email) {
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "Missing required fields" } };
  }

  const organizationRow = await getOrganizationByIdDal({ supabase, organizationId });

  if (!organizationRow || organizationRow.realm_id !== realmId) {
    return { ok: false, error: { code: "ORGANIZATION_NOT_FOUND" } };
  }

  const [actorMembershipRow, isPlatformAdminActor] = await Promise.all([
    getOrganizationMembershipRow({ supabase, organizationId, actorId }),
    isAdminAuthorized({ supabase, userId, actorId }),
  ]);

  if (
    !canManageOrganization({
      actorId,
      organizationRow,
      organizationMembershipRow: actorMembershipRow,
      isPlatformAdminActor,
    })
  ) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  return createOrgMember({
    organizationId,
    displayName,
    email,
    username,
    role,
    status,
  });
}

export default createOrganizationMemberController;
