import { LESSON_COLUMNS } from "@/learning/dal/lessons/getLessonById.dal";

export async function listLessonsByModuleIdDal({
  supabase,
  moduleId,
  includeUnpublished = true,
}) {
  if (!supabase) {
    throw new Error("listLessonsByModuleIdDal requires supabase");
  }

  if (!moduleId) {
    throw new Error("listLessonsByModuleIdDal requires moduleId");
  }

  let query = supabase
    .schema("learning")
    .from("lessons")
    .select(LESSON_COLUMNS)
    .eq("module_id", moduleId)
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

export default listLessonsByModuleIdDal;