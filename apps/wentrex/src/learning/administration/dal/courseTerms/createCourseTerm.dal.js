import { COURSE_TERM_COLUMNS } from "@/learning/administration/dal/courseTerms/getTermById.dal";

export async function createCourseTermDal({
  supabase,
  organizationId,
  name,
  startsOn = null,
  endsOn = null,
  isActive = true,
}) {
  if (!supabase) {
    throw new Error("createCourseTermDal requires supabase");
  }

  if (!organizationId) {
    throw new Error("createCourseTermDal requires organizationId");
  }

  if (!name) {
    throw new Error("createCourseTermDal requires name");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("course_terms")
    .insert({
      organization_id: organizationId,
      name,
      starts_on: startsOn ?? null,
      ends_on: endsOn ?? null,
      is_active: isActive,
    })
    .select(COURSE_TERM_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export default createCourseTermDal;
