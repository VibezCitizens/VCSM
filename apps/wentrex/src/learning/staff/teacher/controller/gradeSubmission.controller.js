import { getSubmissionByIdDal } from "@/learning/dal/submissions/getSubmissionById.dal";
import { getAssignmentByIdDal } from "@/learning/dal/assignments/getAssignmentById.dal";
import { getCourseByIdDal } from "@/learning/dal/courses/getCourseById.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { getGradeBySubmissionIdDal } from "@/learning/dal/grades/getGradeBySubmissionId.dal";
import { upsertGradeDal } from "@/learning/dal/grades/upsertGrade.dal";

import { mapSubmission } from "@/learning/model/submission.model";
import { mapAssignment } from "@/learning/model/assignment.model";
import { mapCourse } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";
import { mapGrade } from "@/learning/model/grade.model";
import { writeAuditLog } from "@/learning/controller/shared/writeAuditLog";

const GRADEABLE_ROLES = new Set(["instructor", "ta", "grader", "admin"]);

function canGrade(membership) {
  return Boolean(
    membership &&
      membership.status &&
      membership.status !== "removed" &&
      GRADEABLE_ROLES.has(membership.role)
  );
}

function normalizeScore(score) {
  if (score === null || score === undefined || score === "") {
    return null;
  }

  const numeric = Number(score);
  if (!Number.isFinite(numeric)) {
    throw new Error("INVALID_SCORE");
  }

  return numeric;
}

function buildGradePayload({ submission, graderActorId, score, feedbackText }) {
  const now = new Date().toISOString();

  return {
    submission_id: submission.id,
    actor_id: submission.actor_id,
    graded_by_actor_id: graderActorId,
    score,
    feedback_text: feedbackText ?? "",
    graded_at: now,
    updated_at: now,
  };
}

export async function gradeSubmissionController({
  supabase,
  actorId,
  realmId = null,
  submissionId,
  score,
  feedbackText = "",
}) {
  if (!supabase) {
    throw new Error("gradeSubmissionController requires supabase");
  }

  if (!actorId) {
    throw new Error("gradeSubmissionController requires actorId");
  }

  if (!submissionId) {
    throw new Error("gradeSubmissionController requires submissionId");
  }

  const submissionRow = await getSubmissionByIdDal({ supabase, submissionId });
  if (!submissionRow) {
    return { ok: false, error: { code: "SUBMISSION_NOT_FOUND" } };
  }

  const assignmentRow = await getAssignmentByIdDal({
    supabase,
    assignmentId: submissionRow.assignment_id,
  });
  if (!assignmentRow) {
    return { ok: false, error: { code: "ASSIGNMENT_NOT_FOUND" } };
  }

  const courseRow = await getCourseByIdDal({
    supabase,
    courseId: submissionRow.course_id,
  });
  if (!courseRow) {
    return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
  }

  if (realmId && courseRow.realm_id !== realmId) {
    return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
  }

  const membershipRow = await getCourseMembershipByActorDal({
    supabase,
    courseId: courseRow.id,
    actorId,
  });

  if (!canGrade(membershipRow)) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const normalizedScore = normalizeScore(score);

  if (
    normalizedScore !== null &&
    assignmentRow.points_possible !== null &&
    assignmentRow.points_possible !== undefined
  ) {
    const maxPoints = Number(assignmentRow.points_possible);

    if (Number.isFinite(maxPoints)) {
      if (normalizedScore < 0 || normalizedScore > maxPoints) {
        return {
          ok: false,
          error: {
            code: "INVALID_SCORE_RANGE",
            details: {
              min: 0,
              max: maxPoints,
            },
          },
        };
      }
    }
  }

  const existingGrade = await getGradeBySubmissionIdDal({
    supabase,
    submissionId,
  });

  const payload = buildGradePayload({
    submission: submissionRow,
    graderActorId: actorId,
    score: normalizedScore,
    feedbackText,
  });

  const gradeRow = await upsertGradeDal({
    supabase,
    existingGradeId: existingGrade?.id ?? null,
    payload: existingGrade?.id
      ? payload
      : { ...payload, created_at: new Date().toISOString() },
  });

  await writeAuditLog({
    supabase,
    actorId,
    action: "grade_submission",
    entityType: "submission",
    entityId: submissionId,
    realmId: courseRow.realm_id ?? realmId,
    context: {
      courseId: courseRow.id,
      assignmentId: assignmentRow.id,
      submissionActorId: submissionRow.actor_id,
      score: normalizedScore,
    },
  });

  return {
    ok: true,
    data: {
      course: mapCourse(courseRow),
      assignment: mapAssignment(assignmentRow),
      submission: mapSubmission(submissionRow),
      membership: mapMembership(membershipRow),
      grade: mapGrade(gradeRow),
    },
  };
}

export default gradeSubmissionController;