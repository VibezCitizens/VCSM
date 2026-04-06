import { SUBMISSION_COLUMNS } from "@/learning/administration/dal/submissions/getSubmissionById.dal";

export async function upsertSubmissionDraftDal({
  supabase,
  assignmentId,
  courseId,
  actorId,
  attemptNo,
  submittedText = "",
  submittedUrl = null,
}) {
  if (!supabase) {
    throw new Error("upsertSubmissionDraftDal requires supabase");
  }

  if (!assignmentId) {
    throw new Error("upsertSubmissionDraftDal requires assignmentId");
  }

  if (!courseId) {
    throw new Error("upsertSubmissionDraftDal requires courseId");
  }

  if (!actorId) {
    throw new Error("upsertSubmissionDraftDal requires actorId");
  }

  if (!attemptNo) {
    throw new Error("upsertSubmissionDraftDal requires attemptNo");
  }

  const payload = {
    assignment_id: assignmentId,
    course_id: courseId,
    actor_id: actorId,
    attempt_no: attemptNo,
    submitted_text: submittedText,
    submitted_url: submittedUrl,
    status: "draft",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .schema("learning")
    .from("submissions")
    .upsert(payload, {
      onConflict: "assignment_id,actor_id,attempt_no",
    })
    .select(SUBMISSION_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export default upsertSubmissionDraftDal;