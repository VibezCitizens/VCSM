import { getCourseByIdDal } from "@/learning/dal/courses/getCourseById.dal";
import { getCourseBySlugDal } from "@/learning/dal/courses/getCourseBySlug.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listModulesByCourseIdDal } from "@/learning/dal/modules/listModulesByCourseId.dal";
import { listLessonsByModuleIdDal } from "@/learning/dal/lessons/listLessonsByModuleId.dal";
import { listLessonProgressByCourseAndActorDal } from "@/learning/dal/lessonProgress/listLessonProgressByCourseAndActor.dal";

import { mapCourse } from "@/learning/model/course.model";
import { mapModules } from "@/learning/model/module.model";
import { mapLessons } from "@/learning/model/lesson.model";
import { mapLessonProgressList } from "@/learning/model/lessonProgress.model";
import { mapMembership } from "@/learning/model/membership.model";

export async function getCourseContentController({
  supabase,
  actorId,
  realmId,
  courseId,
}) {
  let course = await getCourseByIdDal({ supabase, courseId });

  if (!course && realmId) {
    course = await getCourseBySlugDal({
      supabase,
      realmId,
      slug: courseId,
    });
  }

  if (!course || course.realm_id !== realmId) {
    return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
  }

  const membership = await getCourseMembershipByActorDal({
    supabase,
    courseId,
    actorId,
  });

  if (!membership) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const [modules, progress] = await Promise.all([
    listModulesByCourseIdDal({ supabase, courseId, includeUnpublished: false }),
    listLessonProgressByCourseAndActorDal({ supabase, courseId, actorId }),
  ]);

  const lessonGroups = await Promise.all(
    modules.map((moduleRow) =>
      listLessonsByModuleIdDal({
        supabase,
        moduleId: moduleRow.id,
        includeUnpublished: false,
      }),
    ),
  );

  const lessons = lessonGroups.flat();

  return {
    ok: true,
    data: {
      course: mapCourse(course),
      membership: mapMembership(membership),
      modules: mapModules(modules),
      lessons: mapLessons(lessons),
      progress: mapLessonProgressList(progress),
    },
  };
}

export default getCourseContentController;
