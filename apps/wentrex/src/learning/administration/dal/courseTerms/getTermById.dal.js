const COURSE_TERM_COLUMNS = `
  id,
  organization_id,
  name,
  starts_on,
  ends_on,
  is_active,
  created_at,
  updated_at
`;

export async function getTermByIdDal({ supabase, termId }) {
  if (!supabase) {
    throw new Error("getTermByIdDal requires supabase");
  }

  if (!termId) {
    throw new Error("getTermByIdDal requires termId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("course_terms")
    .select(COURSE_TERM_COLUMNS)
    .eq("id", termId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export { COURSE_TERM_COLUMNS };
export default getTermByIdDal;
