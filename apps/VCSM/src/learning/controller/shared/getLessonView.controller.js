import { getLessonByIdDal } from "@/learning/dal/lessons/getLessonById.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { getLessonProgressByLessonAndActorDal } from "@/learning/dal/lessonProgress/getLessonProgressByLessonAndActor.dal";

import { mapLesson } from "@/learning/model/lesson.model";
import { mapLessonProgress } from "@/learning/model/lessonProgress.model";
import { mapMembership } from "@/learning/model/membership.model";

export async function getLessonViewController({
  supabase,
  actorId,
  realmId,
  lessonId,
}) {
  const lesson = await getLessonByIdDal({ supabase, lessonId });
  if (!lesson) {
    return { ok: false, error: { code: "LESSON_NOT_FOUND" } };
  }

  const membership = await getCourseMembershipByActorDal({
    supabase,
    courseId: lesson.course_id,
    actorId,
  });

  if (!membership) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const progress = await getLessonProgressByLessonAndActorDal({
    supabase,
    lessonId,
    actorId,
  });

  return {
    ok: true,
    data: {
      lesson: mapLesson(lesson),
      membership: mapMembership(membership),
      progress: mapLessonProgress(progress),
    },
  };
}

export default getLessonViewController;