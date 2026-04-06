import { SUBMISSION_COLUMNS } from "@/learning/administration/dal/submissions/getSubmissionById.dal";

export async function getSubmissionAttemptDal({
  supabase,
  assignmentId,
  actorId,
  attemptNo = null,
}) {
  if (!supabase) {
    throw new Error("getSubmissionAttemptDal requires supabase");
  }

  if (!assignmentId) {
    throw new Error("getSubmissionAttemptDal requires assignmentId");
  }

  if (!actorId) {
    throw new Error("getSubmissionAttemptDal requires actorId");
  }

  let query = supabase
    .schema("learning")
    .from("submissions")
    .select(SUBMISSION_COLUMNS)
    .eq("assignment_id", assignmentId)
    .eq("actor_id", actorId);

  if (attemptNo !== null) {
    query = query.eq("attempt_no", attemptNo).maybeSingle();
  } else {
    query = query
      .order("attempt_no", { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? null;
}

export default getSubmissionAttemptDal;