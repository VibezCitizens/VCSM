const ASSIGNMENT_COLUMNS = `
  id,
  course_id,
  module_id,
  title,
  instructions,
  submission_type,
  points_possible,
  attempt_limit,
  available_from,
  due_at,
  lock_at,
  allow_late_submissions,
  is_published,
  created_at,
  updated_at,
  created_by_actor_id
`;

export async function getAssignmentByIdDal({ supabase, assignmentId }) {
  if (!supabase) {
    throw new Error("getAssignmentByIdDal requires supabase");
  }

  if (!assignmentId) {
    throw new Error("getAssignmentByIdDal requires assignmentId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("assignments")
    .select(ASSIGNMENT_COLUMNS)
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export { ASSIGNMENT_COLUMNS };
export default getAssignmentByIdDal;