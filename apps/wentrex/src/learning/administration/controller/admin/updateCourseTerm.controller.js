import { getOrganizationByIdDal } from "@/learning/administration/dal/organizations/getOrganizationById.dal";
import { getTermByIdDal } from "@/learning/administration/dal/courseTerms/getTermById.dal";
import { updateCourseTermDal } from "@/learning/administration/dal/courseTerms/updateCourseTerm.dal";
import { mapCourseTerm } from "@/learning/administration/model/courseTerm.model";
import {
  canManageOrganization,
  getOrganizationMembershipRow,
  isAdminAuthorized,
} from "@/learning/administration/controller/admin/adminAccess";

export async function updateCourseTermController({
  supabase,
  userId,
  actorId,
  realmId,
  termId,
  name,
  startsOn,
  endsOn,
  isActive,
}) {
  const termRow = await getTermByIdDal({ supabase, termId });

  if (!termRow) {
    return { ok: false, error: { code: "TERM_NOT_FOUND" } };
  }

  const organizationRow = await getOrganizationByIdDal({
    supabase,
    organizationId: termRow.organization_id,
  });

  if (!organizationRow || organizationRow.realm_id !== realmId) {
    return { ok: false, error: { code: "ORGANIZATION_NOT_FOUND" } };
  }

  const [actorOrganizationMembershipRow, isPlatformAdminActor] = await Promise.all([
    getOrganizationMembershipRow({
      supabase,
      organizationId: termRow.organization_id,
      actorId,
    }),
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

  if (name !== undefined && !name?.trim()) {
    return { ok: false, error: { code: "NAME_REQUIRED" } };
  }

  const updatedRow = await updateCourseTermDal({
    supabase,
    termId,
    name: name !== undefined ? name.trim() : undefined,
    startsOn,
    endsOn,
    isActive,
  });

  return {
    ok: true,
    data: {
      term: mapCourseTerm(updatedRow),
    },
  };
}

export default updateCourseTermController;
