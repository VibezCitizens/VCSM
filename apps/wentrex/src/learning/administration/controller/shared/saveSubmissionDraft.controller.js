import { upsertSubmissionDraftDal } from "@/learning/administration/dal/submissions/upsertSubmissionDraft.dal";
import { getSubmissionAttemptDal } from "@/learning/administration/dal/submissions/getSubmissionAttempt.dal";

import { mapSubmission } from "@/learning/administration/model/submission.model";

export async function saveSubmissionDraftController({
  supabase,
  actorId,
  assignmentId,
  courseId,
  submittedText,
  submittedUrl,
}) {
  const existing = await getSubmissionAttemptDal({
    supabase,
    assignmentId,
    actorId,
  });

  const attemptNo = existing ? existing.attempt_no : 1;

  const submission = await upsertSubmissionDraftDal({
    supabase,
    assignmentId,
    courseId,
    actorId,
    attemptNo,
    submittedText,
    submittedUrl,
  });

  return {
    ok: true,
    data: {
      submission: mapSubmission(submission),
    },
  };
}

export default saveSubmissionDraftController;