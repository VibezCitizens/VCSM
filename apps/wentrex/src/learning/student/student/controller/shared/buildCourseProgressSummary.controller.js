import { listLessonsByCourseIdDal } from "@/learning/dal/lessons/listLessonsByCourseId.dal";
import { listAssignmentsByCourseIdDal } from "@/learning/dal/assignments/listAssignmentsByCourseId.dal";
import { listLessonProgressByCourseAndActorDal } from "@/learning/dal/lessonProgress/listLessonProgressByCourseAndActor.dal";
import { getSubmissionAttemptDal } from "@/learning/dal/submissions/getSubmissionAttempt.dal";
import { getGradeBySubmissionIdDal } from "@/learning/dal/grades/getGradeBySubmissionId.dal";

import { mapCourse } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";

export async function buildCourseProgressSummary({
  supabase,
  actorId,
  courseRow,
  membershipRow,
}) {
  const [lessonRows, assignmentRows, progressRows] = await Promise.all([
    listLessonsByCourseIdDal({
      supabase,
      courseId: courseRow.id,
      includeUnpublished: false,
    }),
    listAssignmentsByCourseIdDal({
      supabase,
      courseId: courseRow.id,
      includeUnpublished: false,
    }),
    listLessonProgressByCourseAndActorDal({
      supabase,
      courseId: courseRow.id,
      actorId,
    }),
  ]);

  const submissionRows = await Promise.all(
    assignmentRows.map((assignmentRow) =>
      getSubmissionAttemptDal({
        supabase,
        assignmentId: assignmentRow.id,
        actorId,
      }),
    ),
  );

  const gradeRows = await Promise.all(
    submissionRows.map((submissionRow) => {
      if (!submissionRow) return null;

      return getGradeBySubmissionIdDal({
        supabase,
        submissionId: submissionRow.id,
      });
    }),
  );

  const totalLessons = lessonRows.length;
  const completedLessons = progressRows.filter(
    (row) => row?.state === "completed",
  ).length;
  const inProgressLessons = progressRows.filter(
    (row) => row?.state === "in_progress",
  ).length;
  const notStartedLessons = Math.max(
    totalLessons - completedLessons - inProgressLessons,
    0,
  );

  const totalAssignments = assignmentRows.length;
  const submittedAssignments = submissionRows.filter(
    (row) => row && ["submitted", "graded", "returned"].includes(row.status),
  ).length;
  const gradedAssignments = gradeRows.filter(Boolean).length;

  const gradePercents = gradeRows
    .map((gradeRow, index) => {
      const assignmentRow = assignmentRows[index];

      if (
        !gradeRow ||
        gradeRow.score === null ||
        gradeRow.score === undefined ||
        !assignmentRow ||
        assignmentRow.points_possible === null ||
        assignmentRow.points_possible === undefined ||
        Number(assignmentRow.points_possible) <= 0
      ) {
        return null;
      }

      return (Number(gradeRow.score) / Number(assignmentRow.points_possible)) * 100;
    })
    .filter((value) => Number.isFinite(value));

  const averageGradePercent =
    gradePercents.length > 0
      ? Math.round(
          (gradePercents.reduce((sum, value) => sum + value, 0) /
            gradePercents.length) *
            100,
        ) / 100
      : null;

  const progressPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return {
    course: mapCourse(courseRow),
    membership: mapMembership(membershipRow),
    totals: {
      lessons: totalLessons,
      completedLessons,
      inProgressLessons,
      notStartedLessons,
      assignments: totalAssignments,
      submittedAssignments,
      gradedAssignments,
      progressPercent,
      averageGradePercent,
    },
  };
}

export function aggregateCourseSummaries(courseSummaries = []) {
  const totals = {
    courses: courseSummaries.length,
    lessons: 0,
    completedLessons: 0,
    inProgressLessons: 0,
    notStartedLessons: 0,
    assignments: 0,
    submittedAssignments: 0,
    gradedAssignments: 0,
    progressPercent: 0,
    averageGradePercent: null,
  };

  const gradePercents = [];

  for (const summary of courseSummaries) {
    const courseTotals = summary?.totals ?? {};

    totals.lessons += courseTotals.lessons ?? 0;
    totals.completedLessons += courseTotals.completedLessons ?? 0;
    totals.inProgressLessons += courseTotals.inProgressLessons ?? 0;
    totals.notStartedLessons += courseTotals.notStartedLessons ?? 0;
    totals.assignments += courseTotals.assignments ?? 0;
    totals.submittedAssignments += courseTotals.submittedAssignments ?? 0;
    totals.gradedAssignments += courseTotals.gradedAssignments ?? 0;

    if (Number.isFinite(courseTotals.averageGradePercent)) {
      gradePercents.push(courseTotals.averageGradePercent);
    }
  }

  totals.progressPercent =
    totals.lessons > 0
      ? Math.round((totals.completedLessons / totals.lessons) * 100)
      : 0;

  totals.averageGradePercent =
    gradePercents.length > 0
      ? Math.round(
          (gradePercents.reduce((sum, value) => sum + value, 0) /
            gradePercents.length) *
            100,
        ) / 100
      : null;

  return totals;
}
