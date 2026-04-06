import { upsertLessonProgressDal } from "@/learning/dal/lessonProgress/upsertLessonProgress.dal";

export async function markLessonCompleteController({
  supabase,
  actorId,
  lessonId,
}) {
  const progress = await upsertLessonProgressDal({
    supabase,
    lessonId,
    actorId,
    state: "completed",
  });

  return {
    ok: true,
    data: {
      progress,
    },
  };
}

export default markLessonCompleteController;