const ASSIGNMENT_RUBRIC_COLUMNS = `
  id,
  assignment_id,
  criterion_key,
  criterion_label,
  points_possible,
  sort_order,
  created_at
`;

export async function listAssignmentRubricsByAssignmentIdDal({
  supabase,
  assignmentId,
}) {
  if (!supabase) {
    throw new Error("listAssignmentRubricsByAssignmentIdDal requires supabase");
  }

  if (!assignmentId) {
    throw new Error("listAssignmentRubricsByAssignmentIdDal requires assignmentId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("assignment_rubrics")
    .select(ASSIGNMENT_RUBRIC_COLUMNS)
    .eq("assignment_id", assignmentId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export { ASSIGNMENT_RUBRIC_COLUMNS };
export default listAssignmentRubricsByAssignmentIdDal;