const MODULE_COLUMNS = `
  id,
  course_id,
  title,
  description,
  sort_order,
  is_published,
  unlock_at,
  created_at,
  updated_at
`;

export async function listModulesByCourseIdDal({
  supabase,
  courseId,
  includeUnpublished = true,
}) {
  if (!supabase) {
    throw new Error("listModulesByCourseIdDal requires supabase");
  }

  if (!courseId) {
    throw new Error("listModulesByCourseIdDal requires courseId");
  }

  let query = supabase
    .schema("learning")
    .from("modules")
    .select(MODULE_COLUMNS)
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

export { MODULE_COLUMNS };
export default listModulesByCourseIdDal;