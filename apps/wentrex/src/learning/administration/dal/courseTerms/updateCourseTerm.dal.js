import { COURSE_TERM_COLUMNS } from "@/learning/administration/dal/courseTerms/getTermById.dal";

export async function updateCourseTermDal({
  supabase,
  termId,
  name,
  startsOn,
  endsOn,
  isActive,
}) {
  if (!supabase) {
    throw new Error("updateCourseTermDal requires supabase");
  }

  if (!termId) {
    throw new Error("updateCourseTermDal requires termId");
  }

  const patch = { updated_at: new Date().toISOString() };

  if (name !== undefined) patch.name = name;
  if (startsOn !== undefined) patch.starts_on = startsOn;
  if (endsOn !== undefined) patch.ends_on = endsOn;
  if (isActive !== undefined) patch.is_active = isActive;

  const { data, error } = await supabase
    .schema("learning")
    .from("course_terms")
    .update(patch)
    .eq("id", termId)
    .select(COURSE_TERM_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export default updateCourseTermDal;
