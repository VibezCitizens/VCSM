import { getSubmissionAttemptDal } from "@/learning/administration/dal/submissions/getSubmissionAttempt.dal";
import { submitAssignmentAttemptDal } from "@/learning/administration/dal/submissions/submitAssignmentAttempt.dal";

import { mapSubmission } from "@/learning/administration/model/submission.model";
import { writeAuditLog } from "@/learning/administration/controller/shared/writeAuditLog";

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

  const now = new Date().toISOString();
  const isLate = false;
  const updated = await submitAssignmentAttemptDal({
    supabase,
    submissionId: submission.id,
    status: isLate ? "late" : "submitted",
    submittedAt: now,
    isLate,
  });

  await writeAuditLog({
    supabase,
    actorId,
    action: "submit_assignment",
    entityType: "submission",
    entityId: submission.id,
    context: {
      assignmentId,
      status: updated?.status ?? null,
      isLate: updated?.is_late ?? null,
    },
  });

  return {
    ok: true,
    data: {
      submission: mapSubmission(updated),
    },
  };
}

export default submitAssignmentController;