export async function listAllCourseSummariesDal({ supabase }) {
  const { data, error } = await supabase
    .schema("learning")
    .from("courses")
    .select("id, realm_id, status");

  if (error) throw error;
  return data ?? [];
}
