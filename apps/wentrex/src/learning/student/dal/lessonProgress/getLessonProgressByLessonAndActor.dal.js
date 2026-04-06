const LESSON_PROGRESS_COLUMNS = `
  id,
  lesson_id,
  actor_id,
  state,
  completed_at,
  updated_at
`;

export async function getLessonProgressByLessonAndActorDal({
  supabase,
  lessonId,
  actorId,
}) {
  if (!supabase) {
    throw new Error("getLessonProgressByLessonAndActorDal requires supabase");
  }

  if (!lessonId) {
    throw new Error("getLessonProgressByLessonAndActorDal requires lessonId");
  }

  if (!actorId) {
    throw new Error("getLessonProgressByLessonAndActorDal requires actorId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("lesson_progress")
    .select(LESSON_PROGRESS_COLUMNS)
    .eq("lesson_id", lessonId)
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export { LESSON_PROGRESS_COLUMNS };
export default getLessonProgressByLessonAndActorDal;