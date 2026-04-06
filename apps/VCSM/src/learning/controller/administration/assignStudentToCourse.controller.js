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
  saveCourseMembership,
} from "@/learning/controller/administration/adminAccess";

export async function assignStudentToCourseController({
  supabase,
  actorId,
  realmId,
  courseId,
  studentActorId,
  status = "active",
}) {
  const courseRow = await getCourseByIdDal({ supabase, courseId });

  if (!courseRow || courseRow.realm_id !== realmId) {
    return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
  }

  if (!studentActorId) {
    return { ok: false, error: { code: "STUDENT_ACTOR_ID_REQUIRED" } };
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

  const nextStatus = normalizeMembershipStatus(status);
  const existingMembershipRows = await listCourseMembershipsByActorDal({
    supabase,
    courseId,
    actorId: studentActorId,
  });
  const blockingMembershipRow = existingMembershipRows.find(
    (membershipRow) =>
      membershipRow.role !== "student" &&
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

  const existingStudentMembershipRow =
    existingMembershipRows.find((membershipRow) => membershipRow.role === "student") ??
    null;
  const data = await saveCourseMembership({
    supabase,
    existingMembershipRow: existingStudentMembershipRow,
    courseId,
    memberActorId: studentActorId,
    role: "student",
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

export default assignStudentToCourseController;
