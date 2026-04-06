import { getSubmissionAttemptDal } from "@/learning/dal/submissions/getSubmissionAttempt.dal";
import { submitAssignmentAttemptDal } from "@/learning/dal/submissions/submitAssignmentAttempt.dal";

import { mapSubmission } from "@/learning/model/submission.model";

export async function submitAssignmentController({
  supabase,
  actorId,
  assignmentId,
}) {
  const submission = await getSubmissionAttemptDal({
    supabase,
    assignmentId,
    actorId,
  });

  if (!submission) {
    return { ok: false, error: { code: "SUBMISSION_NOT_FOUND" } };
  }

  const updated = await submitAssignmentAttemptDal({
    supabase,
    submissionId: submission.id,
  });

  return {
    ok: true,
    data: {
      submission: mapSubmission(updated),
    },
  };
}

export default submitAssignmentController;