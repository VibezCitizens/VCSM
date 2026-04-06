import { getCourseByIdDal } from "@/learning/dal/courses/getCourseById.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listModulesByCourseIdDal } from "@/learning/dal/modules/listModulesByCourseId.dal";
import { listLessonProgressByCourseAndActorDal } from "@/learning/dal/lessonProgress/listLessonProgressByCourseAndActor.dal";
import { listAssignmentsByCourseIdDal } from "@/learning/dal/assignments/listAssignmentsByCourseId.dal";

import { mapCourse } from "@/learning/model/course.model";
import { mapModules } from "@/learning/model/module.model";
import { mapLessonProgressList } from "@/learning/model/lessonProgress.model";
import { mapAssignments } from "@/learning/model/assignment.model";
import { mapMembership } from "@/learning/model/membership.model";

export async function getCourseHomeController({
  supabase,
  actorId,
  realmId,
  courseId,
}) {
  const courseRow = await getCourseByIdDal({ supabase, courseId });
  if (!courseRow || courseRow.realm_id !== realmId) {
    return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
  }

  const membershipRow = await getCourseMembershipByActorDal({
    supabase,
    courseId,
    actorId,
  });

  if (!membershipRow) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const [modulesRows, progressRows, assignmentRows] = await Promise.all([
    listModulesByCourseIdDal({ supabase, courseId, includeUnpublished: false }),
    listLessonProgressByCourseAndActorDal({ supabase, courseId, actorId }),
    listAssignmentsByCourseIdDal({ supabase, courseId, includeUnpublished: false }),
  ]);

  return {
    ok: true,
    data: {
      course: mapCourse(courseRow),
      membership: mapMembership(membershipRow),
      modules: mapModules(modulesRows),
      progress: mapLessonProgressList(progressRows),
      assignments: mapAssignments(assignmentRows),
    },
  };
}

export default getCourseHomeController;