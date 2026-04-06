import { ASSIGNMENT_COLUMNS } from "@/learning/dal/assignments/getAssignmentById.dal";

export async function listAssignmentsByCourseIdDal({
  supabase,
  courseId,
  includeUnpublished = true,
}) {
  if (!supabase) {
    throw new Error("listAssignmentsByCourseIdDal requires supabase");
  }

  if (!courseId) {
    throw new Error("listAssignmentsByCourseIdDal requires courseId");
  }

  let query = supabase
    .schema("learning")
    .from("assignments")
    .select(ASSIGNMENT_COLUMNS)
    .eq("course_id", courseId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listAssignmentsByCourseIdDal;