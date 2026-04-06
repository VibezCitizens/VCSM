import { getOrganizationByIdDal } from "@/learning/administration/dal/organizations/getOrganizationById.dal";
import { createCourseTermDal } from "@/learning/administration/dal/courseTerms/createCourseTerm.dal";
import { mapCourseTerm } from "@/learning/administration/model/courseTerm.model";
import {
  canManageOrganization,
  getOrganizationMembershipRow,
  isAdminAuthorized,
} from "@/learning/administration/controller/admin/adminAccess";

export async function createCourseTermController({
  supabase,
  userId,
  actorId,
  realmId,
  organizationId,
  name,
  startsOn = null,
  endsOn = null,
  isActive = true,
}) {
  if (!name?.trim()) {
    return { ok: false, error: { code: "NAME_REQUIRED" } };
  }

  const organizationRow = await getOrganizationByIdDal({ supabase, organizationId });

  if (!organizationRow || organizationRow.realm_id !== realmId) {
    return { ok: false, error: { code: "ORGANIZATION_NOT_FOUND" } };
  }

  const [actorOrganizationMembershipRow, isPlatformAdminActor] = await Promise.all([
    getOrganizationMembershipRow({ supabase, organizationId, actorId }),
    isAdminAuthorized({ supabase, userId, actorId }),
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

  const termRow = await createCourseTermDal({
    supabase,
    organizationId,
    name: name.trim(),
    startsOn,
    endsOn,
    isActive,
  });

  return {
    ok: true,
    data: {
      term: mapCourseTerm(termRow),
    },
  };
}

export default createCourseTermController;
