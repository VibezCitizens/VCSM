import { COURSE_COLUMNS } from "@/learning/dal/courses/getCourseById.dal";

export async function listCoursesByOrganizationIdDal({
  supabase,
  organizationId,
  includeArchived = true,
  includeDrafts = true,
}) {
  if (!supabase) {
    throw new Error("listCoursesByOrganizationIdDal requires supabase");
  }

  if (!organizationId) {
    throw new Error("listCoursesByOrganizationIdDal requires organizationId");
  }

  let query = supabase
    .schema("learning")
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("organization_id", organizationId)
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

export default listCoursesByOrganizationIdDal;