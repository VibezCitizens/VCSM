import { COURSE_COLUMNS } from "@/learning/dal/courses/getCourseById.dal";

export async function getCourseBySlugDal({ supabase, realmId, slug }) {
  if (!supabase) {
    throw new Error("getCourseBySlugDal requires supabase");
  }

  if (!realmId) {
    throw new Error("getCourseBySlugDal requires realmId");
  }

  if (!slug) {
    throw new Error("getCourseBySlugDal requires slug");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("realm_id", realmId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export default getCourseBySlugDal;