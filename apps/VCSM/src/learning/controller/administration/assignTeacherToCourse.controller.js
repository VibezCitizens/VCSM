import { getCourseByIdDal } from "@/learning/dal/courses/getCourseById.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listCourseMembershipsByActorDal } from "@/learning/dal/memberships/listCourseMembershipsByActor.dal";
import { getOrganizationByIdDal } from "@/learning/dal/organizations/getOrganizationById.dal";

import { mapCourse } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";
import {
  canManageCourse,
  getOrganizationMembershipRow,
  isPlatformAdmin,
  normalizeMembershipStatus,
  normalizeTeacherRole,
  saveCourseMembership,
  TEACHING_ROLES,
} from "@/learning/controller/administration/adminAccess.controller";

export async function assignTeacherToCourseController({
  supabase,
  actorId,
  realmId,
  courseId,
  teacherActorId,
  role = "teacher",
  status = "active",
}) {
  const courseRow = await getCourseByIdDal({ supabase, courseId });

  if (!courseRow || courseRow.realm_id !== realmId) {
    return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
  }

  if (!teacherActorId) {
    return { ok: false, error: { code: "TEACHER_ACTOR_ID_REQUIRED" } };
  }

  const organizationRow = await getOrganizationByIdDal({
    supabase,
    organizationId: courseRow.organization_id,
  });
  const [
    actorCourseMembershipRow,
    actorOrganizationMembershipRow,
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
    isPlatformAdmin({
      supabase,
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

  const nextRole = normalizeTeacherRole(role);
  const nextStatus = normalizeMembershipStatus(status);
  const existingMembershipRows = await listCourseMembershipsByActorDal({
    supabase,
    courseId,
    actorId: teacherActorId,
  });
  const blockingMembershipRow = existingMembershipRows.find(
    (membershipRow) =>
      !TEACHING_ROLES.has(membershipRow.role) &&
      membershipRow.status !== "removed",
  );

  if (blockingMembershipRow) {
    return {
      ok: false,
      error: {
        code: "ACTOR_ALREADY_ASSIGNED_WITH_DIFFERENT_ROLE",
      },
    };
  }

  const existingMembershipRow =
    existingMembershipRows.find((membershipRow) => membershipRow.role === nextRole) ??
    existingMembershipRows.find((membershipRow) => TEACHING_ROLES.has(membershipRow.role)) ??
    null;
  const data = await saveCourseMembership({
    supabase,
    existingMembershipRow,
    courseId,
    memberActorId: teacherActorId,
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

export default assignTeacherToCourseController;
