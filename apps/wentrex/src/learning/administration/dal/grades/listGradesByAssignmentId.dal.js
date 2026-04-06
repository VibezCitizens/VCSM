import { GRADE_COLUMNS } from "@/learning/administration/dal/grades/getGradeBySubmissionId.dal";

export async function listGradesByAssignmentIdDal({
  supabase,
  assignmentId,
}) {
  if (!supabase) {
    throw new Error("listGradesByAssignmentIdDal requires supabase");
  }

  if (!assignmentId) {
    throw new Error("listGradesByAssignmentIdDal requires assignmentId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("grades")
    .select(`
      ${GRADE_COLUMNS},
      submissions!inner (
        id,
        assignment_id
      )
    `)
    .eq("submissions.assignment_id", assignmentId)
    .order("graded_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listGradesByAssignmentIdDal;