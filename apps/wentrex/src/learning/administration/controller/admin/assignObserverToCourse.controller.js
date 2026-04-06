import { getCourseByIdDal } from "@/learning/administration/dal/courses/getCourseById.dal";
import { getCourseMembershipByActorDal } from "@/learning/administration/dal/memberships/getCourseMembershipByActor.dal";
import { listCourseMembershipsByActorDal } from "@/learning/administration/dal/memberships/listCourseMembershipsByActor.dal";
import { getOrganizationByIdDal } from "@/learning/administration/dal/organizations/getOrganizationById.dal";

import { mapCourse } from "@/learning/administration/model/course.model";
import { mapMembership } from "@/learning/administration/model/membership.model";
import {
  canManageCourse,
  getOrganizationMembershipRow,
  isAdminAuthorized,
  normalizeMembershipStatus,
  normalizeObserverRole,
  OBSERVER_ROLES,
  saveCourseMembership,
} from "@/learning/administration/controller/admin/adminAccess";

export async function assignObserverToCourseController({
  supabase,
  userId,
  actorId,
  realmId,
  courseId,
  observerActorId,
  role = "parent",
  status = "active",
}) {
  const courseRow = await getCourseByIdDal({ supabase, courseId });

  if (!courseRow || courseRow.realm_id !== realmId) {
    return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
  }

  if (!observerActorId) {
    return { ok: false, error: { code: "OBSERVER_ACTOR_ID_REQUIRED" } };
  }

  const organizationRow = await getOrganizationByIdDal({
    supabase,
    organizationId: courseRow.organization_id,
  });

  const [
    actorCourseMembershipRow,
    actorOrganizationMembershipRow,
    existingMembershipRows,
    isPlatformAdminActor,
  ] = await Promise.all([
    getCourseMembershipByActorDal({
      supabase,
      courseId,
      actorId,
    }),
    getOrganizationMembershipRow({
      supabase,
      organizationId: courseRow.organization_id,
      actorId,
    }),
    listCourseMembershipsByActorDal({
      supabase,
      courseId,
      actorId: observerActorId,
    }),
    isAdminAuthorized({
      supabase,
      userId,
      actorId,
    }),
  ]);

  if (
    !canManageCourse({
      actorId,
      courseRow,
      courseMembershipRow: actorCourseMembershipRow,
      organizationRow,
      organizationMembershipRow: actorOrganizationMembershipRow,
      isPlatformAdminActor,
    })
  ) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  if (
    existingMembershipRows.some(
      (membershipRow) =>
        !OBSERVER_ROLES.has(membershipRow.role) &&
        membershipRow.status !== "removed",
    )
  ) {
    return {
      ok: false,
      error: {
        code: "ACTOR_ALREADY_ASSIGNED_WITH_DIFFERENT_ROLE",
      },
    };
  }

  const existingMembershipRow =
    existingMembershipRows.find((membershipRow) => OBSERVER_ROLES.has(membershipRow.role)) ??
    null;
  const nextRole = normalizeObserverRole(role);
  const nextStatus = normalizeMembershipStatus(status);
  const data = await saveCourseMembership({
    supabase,
    existingMembershipRow:
      existingMembershipRows.find((membershipRow) => membershipRow.role === nextRole) ??
      existingMembershipRow,
    courseId,
    memberActorId: observerActorId,
    role: nextRole,
    status: nextStatus,
    createdByActorId: actorId,
  });

  return {
    ok: true,
    data: {
      course: mapCourse(courseRow),
      membership: mapMembership(data),
    },
  };
}

export default assignObserverToCourseController;
