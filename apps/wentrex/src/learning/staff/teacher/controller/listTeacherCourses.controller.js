import { listCoursesByActorIdDal } from "@/learning/dal/courses/listCoursesByActorId.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";

import { mapCourses } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";

const TEACHER_ROLES = new Set(["instructor", "ta", "grader", "admin"]);

function isTeacherMembership(membership) {
  return Boolean(
    membership &&
      membership.status &&
      membership.status !== "removed" &&
      TEACHER_ROLES.has(membership.role)
  );
}

export async function listTeacherCoursesController({
  supabase,
  actorId,
  realmId,
}) {
  if (!supabase) {
    throw new Error("listTeacherCoursesController requires supabase");
  }

  if (!actorId) {
    throw new Error("listTeacherCoursesController requires actorId");
  }

  if (!realmId) {
    return { ok: false, error: { code: "REALM_REQUIRED" } };
  }

  const courseRows = await listCoursesByActorIdDal({
    supabase,
    actorId,
    realmId,
  });

  if (!Array.isArray(courseRows) || courseRows.length === 0) {
    return {
      ok: true,
      data: {
        courses: [],
      },
    };
  }

  const memberships = await Promise.all(
    courseRows.map((course) =>
      getCourseMembershipByActorDal({
        supabase,
        courseId: course.id,
        actorId,
      })
    )
  );

  const teacherCoursePairs = courseRows
    .map((course, index) => ({
      course,
      membership: memberships[index],
    }))
    .filter(({ membership }) => isTeacherMembership(membership));

  return {
    ok: true,
    data: {
      courses: teacherCoursePairs.map(({ course }) => mapCourses([course])[0]),
      memberships: teacherCoursePairs.map(({ membership }) =>
        mapMembership(membership)
      ),
    },
  };
}

export default listTeacherCoursesController;