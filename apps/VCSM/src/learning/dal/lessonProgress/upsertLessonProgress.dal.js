import { LESSON_PROGRESS_COLUMNS } from "@/learning/dal/lessonProgress/getLessonProgressByLessonAndActor.dal";

export async function upsertLessonProgressDal({
  supabase,
  lessonId,
  actorId,
  state,
  completedAt = null,
}) {
  if (!supabase) {
    throw new Error("upsertLessonProgressDal requires supabase");
  }

  if (!lessonId) {
    throw new Error("upsertLessonProgressDal requires lessonId");
  }

  if (!actorId) {
    throw new Error("upsertLessonProgressDal requires actorId");
  }

  if (!state) {
    throw new Error("upsertLessonProgressDal requires state");
  }

  const allowedStates = new Set(["not_started", "in_progress", "completed"]);

  if (!allowedStates.has(state)) {
    throw new Error(`upsertLessonProgressDal received invalid state: ${state}`);
  }

  const payload = {
    lesson_id: lessonId,
    actor_id: actorId,
    state,
    completed_at: state === "completed" ? (completedAt ?? new Date().toISOString()) : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .schema("learning")
    .from("lesson_progress")
    .upsert(payload, {
      onConflict: "lesson_id,actor_id",
    })
    .select(LESSON_PROGRESS_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export default upsertLessonProgressDal;