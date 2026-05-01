import { getCourseByIdDal } from "@/learning/dal/courses/getCourseById.dal";
import { getOrganizationByIdDal } from "@/learning/dal/organizations/getOrganizationById.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listCourseMembershipsByActorDal } from "@/learning/dal/memberships/listCourseMembershipsByActor.dal";

import { mapCourse } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";
import {
  canManageCourse,
  getOrganizationMembershipRow,
  isPlatformAdmin,
  normalizeObserverRole,
  OBSERVER_ROLES,
  saveCourseMembership,
} from "@/learning/controller/administration/adminAccess.controller";

async function getExistingLink({
  supabase,
  courseId,
  observerActorId,
  studentActorId,
}) {
  const { data, error } = await supabase
    .schema("learning")
    .from("observer_student_links")
    .select(`
      id,
      course_id,
      observer_actor_id,
      student_actor_id,
      created_at
    `)
    .eq("course_id", courseId)
    .eq("observer_actor_id", observerActorId)
    .eq("student_actor_id", studentActorId)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") {
      return null;
    }

    throw error;
  }

  return data ?? null;
}

export async function linkParentToStudentController({
  supabase,
  actorId,
  realmId,
  courseId,
  parentActorId,
  studentActorId,
}) {
  const courseRow = await getCourseByIdDal({ supabase, courseId });

  if (!courseRow || courseRow.realm_id !== realmId) {
    return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
  }

  if (!parentActorId) {
    return { ok: false, error: { code: "PARENT_ACTOR_ID_REQUIRED" } };
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
    parentMembershipRows,
    studentMembershipRows,
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
      actorId: parentActorId,
    }),
    listCourseMembershipsByActorDal({
      supabase,
      courseId,
      actorId: studentActorId,
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

  const parentMembershipRow =
    parentMembershipRows.find((membershipRow) => OBSERVER_ROLES.has(membershipRow.role)) ??
    parentMembershipRows[0] ??
    null;
  const studentMembershipRow =
    studentMembershipRows.find(
      (membershipRow) =>
        membershipRow.role === "student" &&
        membershipRow.status !== "removed",
    ) ?? null;

  if (
    parentMembershipRows.some(
      (membershipRow) =>
        membershipRow.status !== "removed" &&
        !OBSERVER_ROLES.has(membershipRow.role),
    )
  ) {
    return {
      ok: false,
      error: {
        code: "ACTOR_ALREADY_ASSIGNED_WITH_DIFFERENT_ROLE",
      },
    };
  }

  if (
    !studentMembershipRow ||
    studentMembershipRow.status === "removed"
  ) {
    return { ok: false, error: { code: "STUDENT_MEMBERSHIP_NOT_FOUND" } };
  }

  let ensuredParentMembershipRow = parentMembershipRow;

  if (
    !ensuredParentMembershipRow ||
    ensuredParentMembershipRow.status === "removed"
  ) {
    ensuredParentMembershipRow = await saveCourseMembership({
      supabase,
      existingMembershipRow:
        parentMembershipRows.find((membershipRow) => membershipRow.role === "parent") ??
        ensuredParentMembershipRow,
      courseId,
      memberActorId: parentActorId,
      role: normalizeObserverRole(ensuredParentMembershipRow?.role),
      status: "active",
      createdByActorId: actorId,
    });
  }

  const existingLink = await getExistingLink({
    supabase,
    courseId,
    observerActorId: parentActorId,
    studentActorId,
  });

  if (existingLink) {
    return {
      ok: true,
      data: {
        course: mapCourse(courseRow),
        parentMembership: mapMembership(ensuredParentMembershipRow),
        studentMembership: mapMembership(studentMembershipRow),
        link: {
          id: existingLink.id,
          courseId: existingLink.course_id,
          observerActorId: existingLink.observer_actor_id,
          studentActorId: existingLink.student_actor_id,
          createdAt: existingLink.created_at ?? null,
        },
      },
    };
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("observer_student_links")
    .insert({
      course_id: courseId,
      observer_actor_id: parentActorId,
      student_actor_id: studentActorId,
    })
    .select(`
      id,
      course_id,
      observer_actor_id,
      student_actor_id,
      created_at
    `)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    ok: true,
    data: {
      course: mapCourse(courseRow),
      parentMembership: mapMembership(ensuredParentMembershipRow),
      studentMembership: mapMembership(studentMembershipRow),
      link: {
        id: data.id,
        courseId: data.course_id,
        observerActorId: data.observer_actor_id,
        studentActorId: data.student_actor_id,
        createdAt: data.created_at ?? null,
      },
    },
  };
}

export default linkParentToStudentController;
