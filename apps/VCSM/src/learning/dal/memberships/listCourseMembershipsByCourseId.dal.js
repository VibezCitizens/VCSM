import { COURSE_MEMBERSHIP_COLUMNS } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";

export async function listCourseMembershipsByCourseIdDal({
  supabase,
  courseId,
  statuses = null,
  roles = null,
}) {
  if (!supabase) {
    throw new Error("listCourseMembershipsByCourseIdDal requires supabase");
  }

  if (!courseId) {
    throw new Error("listCourseMembershipsByCourseIdDal requires courseId");
  }

  let query = supabase
    .schema("learning")
    .from("course_memberships")
    .select(COURSE_MEMBERSHIP_COLUMNS)
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  if (Array.isArray(statuses) && statuses.length > 0) {
    query = query.in("status", statuses);
  }

  if (Array.isArray(roles) && roles.length > 0) {
    query = query.in("role", roles);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listCourseMembershipsByCourseIdDal;