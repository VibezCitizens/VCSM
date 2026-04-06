const COURSE_COLUMNS = `
  id,
  organization_id,
  term_id,
  code,
  slug,
  title,
  description,
  cover_image_url,
  syllabus,
  visibility,
  status,
  created_at,
  updated_at,
  published_at,
  created_by_actor_id,
  realm_id
`;

export async function getCourseByIdDal({ supabase, courseId }) {
  if (!supabase) {
    throw new Error("getCourseByIdDal requires supabase");
  }

  if (!courseId) {
    throw new Error("getCourseByIdDal requires courseId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("id", courseId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export { COURSE_COLUMNS };
export default getCourseByIdDal;
