import { getCourseByIdDal } from "@/learning/administration/dal/courses/getCourseById.dal";
import { getCourseMembershipByActorDal } from "@/learning/administration/dal/memberships/getCourseMembershipByActor.dal";
import { listModulesByCourseIdDal } from "@/learning/administration/dal/modules/listModulesByCourseId.dal";
import { listLessonProgressByCourseAndActorDal } from "@/learning/administration/dal/lessonProgress/listLessonProgressByCourseAndActor.dal";
import { listAssignmentsByCourseIdDal } from "@/learning/administration/dal/assignments/listAssignmentsByCourseId.dal";

import { mapCourse } from "@/learning/administration/model/course.model";
import { mapModules } from "@/learning/administration/model/module.model";
import { mapLessonProgressList } from "@/learning/administration/model/lessonProgress.model";
import { mapAssignments } from "@/learning/administration/model/assignment.model";
import { mapMembership } from "@/learning/administration/model/membership.model";

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