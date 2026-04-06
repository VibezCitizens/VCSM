const SUBMISSION_COLUMNS = `
  id,
  assignment_id,
  course_id,
  attempt_no,
  status,
  submitted_text,
  submitted_url,
  submitted_at,
  is_late,
  created_at,
  updated_at,
  actor_id
`;

export async function getSubmissionByIdDal({ supabase, submissionId }) {
  if (!supabase) {
    throw new Error("getSubmissionByIdDal requires supabase");
  }

  if (!submissionId) {
    throw new Error("getSubmissionByIdDal requires submissionId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("submissions")
    .select(SUBMISSION_COLUMNS)
    .eq("id", submissionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export { SUBMISSION_COLUMNS };
export default getSubmissionByIdDal;