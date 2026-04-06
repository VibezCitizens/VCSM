const LESSON_COLUMNS = `
  id,
  module_id,
  course_id,
  title,
  lesson_type,
  body,
  external_url,
  file_url,
  sort_order,
  is_published,
  created_at,
  updated_at,
  created_by_actor_id
`;

export async function getLessonByIdDal({ supabase, lessonId }) {
  if (!supabase) {
    throw new Error("getLessonByIdDal requires supabase");
  }

  if (!lessonId) {
    throw new Error("getLessonByIdDal requires lessonId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("lessons")
    .select(LESSON_COLUMNS)
    .eq("id", lessonId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export { LESSON_COLUMNS };
export default getLessonByIdDal;