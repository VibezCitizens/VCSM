import { COURSE_COLUMNS } from "@/learning/administration/dal/courses/getCourseById.dal";

export async function listCoursesByRealmIdDal({
  supabase,
  realmId,
  includeArchived = true,
  includeDrafts = true,
}) {
  if (!supabase) {
    throw new Error("listCoursesByRealmIdDal requires supabase");
  }

  if (!realmId) {
    throw new Error("listCoursesByRealmIdDal requires realmId");
  }

  let query = supabase
    .schema("learning")
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("realm_id", realmId)
    .order("created_at", { ascending: false });

  if (!includeArchived) {
    query = query.neq("status", "archived");
  }

  if (!includeDrafts) {
    query = query.neq("status", "draft");
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listCoursesByRealmIdDal;
