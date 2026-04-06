import { getCourseByIdDal } from "@/learning/dal/courses/getCourseById.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listAssignmentsByCourseIdDal } from "@/learning/dal/assignments/listAssignmentsByCourseId.dal";
import { listSubmissionsByAssignmentIdDal } from "@/learning/dal/submissions/listSubmissionsByAssignmentId.dal";
import { listGradesByAssignmentIdDal } from "@/learning/dal/grades/listGradesByAssignmentId.dal";
import { listAssignmentRubricsByAssignmentIdDal } from "@/learning/dal/rubrics/listAssignmentRubricsByAssignmentId.dal";

import { mapCourse } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";
import { mapAssignments } from "@/learning/model/assignment.model";
import { mapAssignmentRubrics } from "@/learning/model/assignmentRubric.model";

const TEACHER_ROLES = new Set(["instructor", "ta", "grader", "admin"]);

function isTeacherMembership(membership) {
  return Boolean(
    membership &&
      membership.status &&
      membership.status !== "removed" &&
      TEACHER_ROLES.has(membership.role)
  );
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export async function listTeacherAssignmentsController({
  supabase,
  actorId,
  realmId,
  courseId,
}) {
  if (!supabase) {
    throw new Error("listTeacherAssignmentsController requires supabase");
  }

  if (!actorId) {
    throw new Error("listTeacherAssignmentsController requires actorId");
  }

  if (!realmId) {
    throw new Error("listTeacherAssignmentsController requires realmId");
  }

  if (!courseId) {
    throw new Error("listTeacherAssignmentsController requires courseId");
  }

  const courseRow = await getCourseByIdDal({ supabase, courseId });

  if (!courseRow || courseRow.realm_id !== realmId) {
    return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
  }

  const membershipRow = await getCourseMembershipByActorDal({
    supabase,
    courseId,
    actorId,
  });

  if (!isTeacherMembership(membershipRow)) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  const assignmentRows = await listAssignmentsByCourseIdDal({
    supabase,
    courseId,
    includeUnpublished: true,
  });

  const submissionsByAssignment = await Promise.all(
    assignmentRows.map((assignment) =>
      listSubmissionsByAssignmentIdDal({
        supabase,
        assignmentId: assignment.id,
      })
    )
  );

  const gradesByAssignment = await Promise.all(
    assignmentRows.map((assignment) =>
      listGradesByAssignmentIdDal({
        supabase,
        assignmentId: assignment.id,
      })
    )
  );

  const rubricsByAssignment = await Promise.all(
    assignmentRows.map((assignment) =>
      listAssignmentRubricsByAssignmentIdDal({
        supabase,
        assignmentId: assignment.id,
      })
    )
  );

  const assignments = mapAssignments(assignmentRows).map((assignment, index) => {
    const submissions = submissionsByAssignment[index] ?? [];
    const grades = gradesByAssignment[index] ?? [];
    const rubrics = mapAssignmentRubrics(rubricsByAssignment[index] ?? []);

    const gradedSubmissionIds = new Set(
      grades.map((grade) => grade.submission_id).filter(Boolean)
    );

    const submittedCount = submissions.filter(
      (submission) => submission.status === "submitted"
    ).length;

    const draftCount = submissions.filter(
      (submission) => submission.status === "draft"
    ).length;

    const gradedCount = grades.length;

    const pendingCount = submissions.filter(
      (submission) =>
        submission.status === "submitted" &&
        !gradedSubmissionIds.has(submission.id)
    ).length;

    const scoredGrades = grades.filter(
      (grade) => grade.score !== null && grade.score !== undefined
    );

    const averageScore =
      scoredGrades.length > 0
        ? scoredGrades.reduce((sum, grade) => sum + toNumber(grade.score), 0) /
          scoredGrades.length
        : null;

    return {
      ...assignment,
      rubricCriteria: rubrics,
      submissionCount: submissions.length,
      submittedCount,
      draftCount,
      gradedCount,
      pendingCount,
      averageScore,
    };
  });

  return {
    ok: true,
    data: {
      course: mapCourse(courseRow),
      membership: mapMembership(membershipRow),
      assignments,
    },
  };
}

export default listTeacherAssignmentsController;