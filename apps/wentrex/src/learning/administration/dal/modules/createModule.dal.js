export async function createModuleDal({
  supabase,
  courseId,
  title,
  description = "",
  sortOrder = 1,
}) {
  if (!supabase) throw new Error("createModuleDal requires supabase");
  if (!courseId) throw new Error("createModuleDal requires courseId");
  if (!title) throw new Error("createModuleDal requires title");

  const { data, error } = await supabase
    .schema("learning")
    .from("modules")
    .insert({
      course_id: courseId,
      title,
      description,
      sort_order: sortOrder,
    })
    .select("id, course_id, title, description, sort_order, created_at")
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default createModuleDal;
