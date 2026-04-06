import { getAssignmentByIdDal } from "@/learning/administration/dal/assignments/getAssignmentById.dal";
import { getSubmissionAttemptDal } from "@/learning/administration/dal/submissions/getSubmissionAttempt.dal";
import { listSubmissionFilesBySubmissionIdDal } from "@/learning/administration/dal/submissionFiles/listSubmissionFilesBySubmissionId.dal";
import { getGradeBySubmissionIdDal } from "@/learning/administration/dal/grades/getGradeBySubmissionId.dal";

import { mapAssignment } from "@/learning/administration/model/assignment.model";
import { mapSubmission } from "@/learning/administration/model/submission.model";
import { mapSubmissionFiles } from "@/learning/administration/model/submissionFile.model";
import { mapGrade } from "@/learning/administration/model/grade.model";

export async function getAssignmentSubmissionController({
  supabase,
  actorId,
  assignmentId,
}) {
  const assignment = await getAssignmentByIdDal({ supabase, assignmentId });
  if (!assignment) {
    return { ok: false, error: { code: "ASSIGNMENT_NOT_FOUND" } };
  }

  const submission = await getSubmissionAttemptDal({
    supabase,
    assignmentId,
    actorId,
  });

  let files = [];
  let grade = null;

  if (submission) {
    const [fileRows, gradeRow] = await Promise.all([
      listSubmissionFilesBySubmissionIdDal({
        supabase,
        submissionId: submission.id,
      }),
      getGradeBySubmissionIdDal({
        supabase,
        submissionId: submission.id,
      }),
    ]);

    files = mapSubmissionFiles(fileRows);
    grade = mapGrade(gradeRow);
  }

  return {
    ok: true,
    data: {
      assignment: mapAssignment(assignment),
      submission: mapSubmission(submission),
      files,
      grade,
    },
  };
}

export default getAssignmentSubmissionController;