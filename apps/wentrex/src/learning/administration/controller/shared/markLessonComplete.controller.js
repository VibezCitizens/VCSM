import { upsertLessonProgressDal } from "@/learning/administration/dal/lessonProgress/upsertLessonProgress.dal";

export async function markLessonCompleteController({
  supabase,
  actorId,
  lessonId,
}) {
  const state = "completed";
  const completedAt = state === "completed" ? new Date().toISOString() : null;

  const progress = await upsertLessonProgressDal({
    supabase,
    lessonId,
    actorId,
    state,
    completedAt,
  });

  return {
    ok: true,
    data: {
      progress,
    },
  };
}

export default markLessonCompleteController;