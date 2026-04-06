const GRADE_COLUMNS = `
  id,
  submission_id,
  score,
  feedback_text,
  feedback_private,
  graded_at,
  created_at,
  updated_at,
  actor_id,
  graded_by_actor_id
`;

export async function getGradeBySubmissionIdDal({ supabase, submissionId }) {
  if (!supabase) {
    throw new Error("getGradeBySubmissionIdDal requires supabase");
  }

  if (!submissionId) {
    throw new Error("getGradeBySubmissionIdDal requires submissionId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("grades")
    .select(GRADE_COLUMNS)
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export { GRADE_COLUMNS };
export default getGradeBySubmissionIdDal;