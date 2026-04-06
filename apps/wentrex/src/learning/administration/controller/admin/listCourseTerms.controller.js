import { getOrganizationByIdDal } from "@/learning/administration/dal/organizations/getOrganizationById.dal";
import { listTermsByOrganizationIdDal } from "@/learning/administration/dal/courseTerms/listTermsByOrganizationId.dal";
import { mapCourseTerms } from "@/learning/administration/model/courseTerm.model";
import {
  canManageOrganization,
  getOrganizationMembershipRow,
  isAdminAuthorized,
} from "@/learning/administration/controller/admin/adminAccess";

export async function listCourseTermsController({
  supabase,
  userId,
  actorId,
  realmId,
  organizationId,
}) {
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

  const termRows = await listTermsByOrganizationIdDal({ supabase, organizationId });

  return {
    ok: true,
    data: {
      terms: mapCourseTerms(termRows),
    },
  };
}

export default listCourseTermsController;
