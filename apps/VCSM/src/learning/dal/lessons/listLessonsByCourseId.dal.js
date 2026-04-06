import { LESSON_COLUMNS } from "@/learning/dal/lessons/getLessonById.dal";

export async function listLessonsByCourseIdDal({
  supabase,
  courseId,
  includeUnpublished = true,
}) {
  if (!supabase) {
    throw new Error("listLessonsByCourseIdDal requires supabase");
  }

  if (!courseId) {
    throw new Error("listLessonsByCourseIdDal requires courseId");
  }

  let query = supabase
    .schema("learning")
    .from("lessons")
    .select(LESSON_COLUMNS)
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listLessonsByCourseIdDal;