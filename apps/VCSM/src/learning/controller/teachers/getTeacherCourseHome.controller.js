import { getCourseByIdDal } from "@/learning/dal/courses/getCourseById.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listModulesByCourseIdDal } from "@/learning/dal/modules/listModulesByCourseId.dal";
import { listLessonsByCourseIdDal } from "@/learning/dal/lessons/listLessonsByCourseId.dal";
import { listAssignmentsByCourseIdDal } from "@/learning/dal/assignments/listAssignmentsByCourseId.dal";
import { listCourseMembershipsByCourseIdDal } from "@/learning/dal/memberships/listCourseMembershipsByCourseId.dal";

import { mapCourse } from "@/learning/model/course.model";
import { mapModules } from "@/learning/model/module.model";
import { mapLessons } from "@/learning/model/lesson.model";
import { mapAssignments } from "@/learning/model/assignment.model";
import { mapMembership, mapMemberships } from "@/learning/model/membership.model";

const TEACHER_ROLES = new Set(["instructor", "ta", "grader", "admin"]);
const STUDENT_LIKE_ROLES = new Set(["student", "observer"]);

function isTeacherMembership(membership) {
  return Boolean(
    membership &&
      membership.status &&
      membership.status !== "removed" &&
      TEACHER_ROLES.has(membership.role)
  );
}

export async function getTeacherCourseHomeController({
  supabase,
  actorId,
  realmId,
  courseId,
}) {
  if (!supabase) {
    throw new Error("getTeacherCourseHomeController requires supabase");
  }

  if (!actorId) {
    throw new Error("getTeacherCourseHomeController requires actorId");
  }

  if (!realmId) {
    throw new Error("getTeacherCourseHomeController requires realmId");
  }

  if (!courseId) {
    throw new Error("getTeacherCourseHomeController requires courseId");
  }

  const courseRow = await getCourseByIdDal({ supabase, courseId });

  if (!courseRow || courseRow.realm_id !== realmId) {
    return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
  }

  const membershipRow = await getCourseMembershipByActorDal({
    supabase,
    courseId,
    actorId,
  });

  if (!isTeacherMembership(membershipRow)) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const [moduleRows, lessonRows, assignmentRows, rosterRows] = await Promise.all([
    listModulesByCourseIdDal({
      supabase,
      courseId,
      includeUnpublished: true,
    }),
    listLessonsByCourseIdDal({
      supabase,
      courseId,
      includeUnpublished: true,
    }),
    listAssignmentsByCourseIdDal({
      supabase,
      courseId,
      includeUnpublished: true,
    }),
    listCourseMembershipsByCourseIdDal({
      supabase,
      courseId,
    }),
  ]);

  const memberships = mapMemberships(rosterRows);
  const staff = memberships.filter((item) => TEACHER_ROLES.has(item.role));
  const learners = memberships.filter((item) => STUDENT_LIKE_ROLES.has(item.role));

  return {
    ok: true,
    data: {
      course: mapCourse(courseRow),
      membership: mapMembership(membershipRow),
      modules: mapModules(moduleRows),
      lessons: mapLessons(lessonRows),
      assignments: mapAssignments(assignmentRows),
      roster: {
        all: memberships,
        staff,
        learners,
        counts: {
          total: memberships.length,
          staff: staff.length,
          learners: learners.length,
        },
      },
    },
  };
}

export default getTeacherCourseHomeController;