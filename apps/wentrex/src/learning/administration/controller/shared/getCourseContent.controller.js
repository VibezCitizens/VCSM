import { getCourseByIdDal } from "@/learning/administration/dal/courses/getCourseById.dal";
import { getCourseBySlugDal } from "@/learning/administration/dal/courses/getCourseBySlug.dal";
import { getCourseMembershipByActorDal } from "@/learning/administration/dal/memberships/getCourseMembershipByActor.dal";
import { listModulesByCourseIdDal } from "@/learning/administration/dal/modules/listModulesByCourseId.dal";
import { listLessonsByModuleIdDal } from "@/learning/administration/dal/lessons/listLessonsByModuleId.dal";
import { listLessonProgressByCourseAndActorDal } from "@/learning/administration/dal/lessonProgress/listLessonProgressByCourseAndActor.dal";

import { mapCourse } from "@/learning/administration/model/course.model";
import { mapModules } from "@/learning/administration/model/module.model";
import { mapLessons } from "@/learning/administration/model/lesson.model";
import { mapLessonProgressList } from "@/learning/administration/model/lessonProgress.model";
import { mapMembership } from "@/learning/administration/model/membership.model";

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
