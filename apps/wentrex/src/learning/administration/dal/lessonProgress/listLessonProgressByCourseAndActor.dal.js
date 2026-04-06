import { LESSON_PROGRESS_COLUMNS } from "@/learning/administration/dal/lessonProgress/getLessonProgressByLessonAndActor.dal";

export async function listLessonProgressByCourseAndActorDal({
  supabase,
  courseId,
  actorId,
}) {
  if (!supabase) {
    throw new Error("listLessonProgressByCourseAndActorDal requires supabase");
  }

  if (!courseId) {
    throw new Error("listLessonProgressByCourseAndActorDal requires courseId");
  }

  if (!actorId) {
    throw new Error("listLessonProgressByCourseAndActorDal requires actorId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("lesson_progress")
    .select(`
      ${LESSON_PROGRESS_COLUMNS},
      lessons!inner (
        id,
        course_id
      )
    `)
    .eq("actor_id", actorId)
    .eq("lessons.course_id", courseId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listLessonProgressByCourseAndActorDal;