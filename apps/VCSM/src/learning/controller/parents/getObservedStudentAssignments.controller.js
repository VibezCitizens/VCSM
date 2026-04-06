import { getCourseByIdDal } from "@/learning/dal/courses/getCourseById.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listAssignmentsByCourseIdDal } from "@/learning/dal/assignments/listAssignmentsByCourseId.dal";
import { getSubmissionAttemptDal } from "@/learning/dal/submissions/getSubmissionAttempt.dal";
import { getGradeBySubmissionIdDal } from "@/learning/dal/grades/getGradeBySubmissionId.dal";

import { mapCourse } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";
import { mapAssignment } from "@/learning/model/assignment.model";
import { mapSubmission } from "@/learning/model/submission.model";
import { mapGrade } from "@/learning/model/grade.model";

function isObserverRole(role) {
  return ["parent", "observer"].includes(role);
}

async function getObserverStudentLink({
  supabase,
  observerActorId,
  studentActorId,
  courseId,
}) {
  const { data, error } = await supabase
    .schema("learning")
    .from("observer_student_links")
    .select(`
      id,
      course_id,
      observer_actor_id,
      student_actor_id,
      created_at
    `)
    .eq("observer_actor_id", observerActorId)
    .eq("student_actor_id", studentActorId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

function getAssignmentState({ submission, grade }) {
  if (grade) return "graded";
  if (!submission) return "not_started";
  if (submission.status === "submitted") return "submitted";
  if (submission.status === "draft") return "draft";
  if (submission.status === "returned") return "returned";
  return submission.status ?? "unknown";
}

function buildSummary(items = []) {
  const summary = {
    totalAssignments: items.length,
    gradedAssignments: 0,
    submittedAssignments: 0,
    draftAssignments: 0,
    notStartedAssignments: 0,
    overdueAssignments: 0,
    averageGradePercent: null,
  };

  const gradePercents = [];

  for (const item of items) {
    if (item.state === "graded") summary.gradedAssignments += 1;
    if (["submitted", "graded", "returned"].includes(item.state)) {
      summary.submittedAssignments += 1;
    }
    if (item.state === "draft") summary.draftAssignments += 1;
    if (item.state === "not_started") summary.notStartedAssignments += 1;

    if (item.isOverdue) {
      summary.overdueAssignments += 1;
    }

    if (Number.isFinite(item.gradePercent)) {
      gradePercents.push(item.gradePercent);
    }
  }

  summary.averageGradePercent =
    gradePercents.length > 0
      ? Math.round(
          (gradePercents.reduce((sum, value) => sum + value, 0) /
            gradePercents.length) *
            100,
        ) / 100
      : null;

  return summary;
}

export async function getObservedStudentAssignmentsController({
  supabase,
  actorId,
  realmId,
  courseId,
  studentActorId,
}) {
  const courseRow = await getCourseByIdDal({ supabase, courseId });

  if (!courseRow || courseRow.realm_id !== realmId) {
    return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
  }

  const [observerMembershipRow, studentMembershipRow, linkRow] = await Promise.all([
    getCourseMembershipByActorDal({
      supabase,
      courseId,
      actorId,
    }),
    getCourseMembershipByActorDal({
      supabase,
      courseId,
      actorId: studentActorId,
    }),
    getObserverStudentLink({
      supabase,
      observerActorId: actorId,
      studentActorId,
      courseId,
    }),
  ]);

  if (
    !observerMembershipRow ||
    observerMembershipRow.status === "removed" ||
    !isObserverRole(observerMembershipRow.role)
  ) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  if (
    !studentMembershipRow ||
    studentMembershipRow.status === "removed" ||
    studentMembershipRow.role !== "student" ||
    !linkRow
  ) {
    return { ok: false, error: { code: "STUDENT_NOT_OBSERVED" } };
  }

  const assignmentRows = await listAssignmentsByCourseIdDal({
    supabase,
    courseId,
    includeUnpublished: false,
  });

  const items = await Promise.all(
    assignmentRows.map(async (assignmentRow) => {
      const submissionRow = await getSubmissionAttemptDal({
        supabase,
        assignmentId: assignmentRow.id,
        actorId: studentActorId,
      });

      const gradeRow = submissionRow
        ? await getGradeBySubmissionIdDal({
            supabase,
            submissionId: submissionRow.id,
          })
        : null;

      const pointsPossible = Number(assignmentRow.points_possible ?? 0);
      const score = Number(gradeRow?.score ?? 0);

      const gradePercent =
        gradeRow && pointsPossible > 0
          ? Math.round((score / pointsPossible) * 10000) / 100
          : null;

      const dueAt = assignmentRow.due_at ? new Date(assignmentRow.due_at) : null;
      const isOverdue =
        !!dueAt &&
        Number.isFinite(dueAt.getTime()) &&
        dueAt.getTime() < Date.now() &&
        !submissionRow;

      return {
        id: assignmentRow.id,
        state: getAssignmentState({
          submission: submissionRow,
          grade: gradeRow,
        }),
        isOverdue,
        gradePercent,
        assignment: mapAssignment(assignmentRow),
        submission: mapSubmission(submissionRow),
        grade: mapGrade(gradeRow),
      };
    }),
  );

  items.sort((left, right) => {
    const leftDate = left?.assignment?.dueAt ?? left?.assignment?.createdAt ?? "";
    const rightDate =
      right?.assignment?.dueAt ?? right?.assignment?.createdAt ?? "";

    return String(leftDate).localeCompare(String(rightDate));
  });

  return {
    ok: true,
    data: {
      course: mapCourse(courseRow),
      observerMembership: mapMembership(observerMembershipRow),
      studentMembership: mapMembership(studentMembershipRow),
      observedLink: {
        id: linkRow.id,
        courseId: linkRow.course_id,
        observerActorId: linkRow.observer_actor_id,
        studentActorId: linkRow.student_actor_id,
        createdAt: linkRow.created_at ?? null,
      },
      assignments: items,
      summary: buildSummary(items),
    },
  };
}

export default getObservedStudentAssignmentsController;