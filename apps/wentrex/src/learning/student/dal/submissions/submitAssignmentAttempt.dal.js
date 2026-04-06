import { SUBMISSION_COLUMNS } from "@/learning/dal/submissions/getSubmissionById.dal";

export async function submitAssignmentAttemptDal({
  supabase,
  submissionId,
  status,
  submittedAt,
  isLate = false,
}) {
  if (!supabase) {
    throw new Error("submitAssignmentAttemptDal requires supabase");
  }

  if (!submissionId) {
    throw new Error("submitAssignmentAttemptDal requires submissionId");
  }

  const payload = {
    status,
    submitted_at: submittedAt,
    is_late: isLate,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .schema("learning")
    .from("submissions")
    .update(payload)
    .eq("id", submissionId)
    .select(SUBMISSION_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export default submitAssignmentAttemptDal;