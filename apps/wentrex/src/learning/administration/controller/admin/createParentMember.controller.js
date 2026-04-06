import { createParent } from "@/features/services/supabase/createParent";
import { getOrganizationByIdDal } from "@/learning/administration/dal/organizations/getOrganizationById.dal";
import { getCourseByIdDal } from "@/learning/administration/dal/courses/getCourseById.dal";
import {
  canManageOrganization,
  getOrganizationMembershipRow,
  isAdminAuthorized,
} from "@/learning/administration/controller/admin/adminAccess";

/**
 * Create a parent member and link to a student in a course.
 *
 * Auth checks:
 *   - Organization must exist in caller's realm
 *   - Course must belong to that organization
 *   - Caller must be org owner, org admin, or platform admin
 */
export async function createParentMemberController({
  supabase,
  userId,
  actorId,
  realmId,
  organizationId,
  courseId,
  studentActorId,
  displayName,
  email,
  username = null,
  password = null,
  sendInvite = false,
}) {
  if (!organizationId || !courseId || !studentActorId || !displayName?.trim() || !email?.trim()) {
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "Missing required fields" } };
  }

  const organizationRow = await getOrganizationByIdDal({ supabase, organizationId });

  if (!organizationRow || organizationRow.realm_id !== realmId) {
    return { ok: false, error: { code: "ORGANIZATION_NOT_FOUND" } };
  }

  const courseRow = await getCourseByIdDal({ supabase, courseId });

  if (!courseRow || courseRow.realm_id !== realmId) {
    return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
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

  return createParent({
    organizationId,
    courseId,
    studentActorId,
    displayName,
    email,
    username,
    password,
    sendInvite,
  });
}

export default createParentMemberController;
