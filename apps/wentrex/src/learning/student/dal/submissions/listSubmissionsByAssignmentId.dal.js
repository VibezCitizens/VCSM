import { SUBMISSION_COLUMNS } from "@/learning/dal/submissions/getSubmissionById.dal";

export async function listSubmissionsByAssignmentIdDal({
  supabase,
  assignmentId,
}) {
  if (!supabase) {
    throw new Error("listSubmissionsByAssignmentIdDal requires supabase");
  }

  if (!assignmentId) {
    throw new Error("listSubmissionsByAssignmentIdDal requires assignmentId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("submissions")
    .select(SUBMISSION_COLUMNS)
    .eq("assignment_id", assignmentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listSubmissionsByAssignmentIdDal;