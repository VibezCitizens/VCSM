import { getCourseByIdDal } from "@/learning/dal/courses/getCourseById.dal";
import { listCoursesByActorIdDal } from "@/learning/dal/courses/listCoursesByActorId.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listLessonsByCourseIdDal } from "@/learning/dal/lessons/listLessonsByCourseId.dal";
import { listAssignmentsByCourseIdDal } from "@/learning/dal/assignments/listAssignmentsByCourseId.dal";
import { listLessonProgressByCourseAndActorDal } from "@/learning/dal/lessonProgress/listLessonProgressByCourseAndActor.dal";
import { getSubmissionAttemptDal } from "@/learning/dal/submissions/getSubmissionAttempt.dal";
import { getGradeBySubmissionIdDal } from "@/learning/dal/grades/getGradeBySubmissionId.dal";

import { mapCourse, mapCourses } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";

async function buildCourseProgressSummary({
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

function aggregateCourseSummaries(courseSummaries = []) {
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

export async function getStudentProgressSummaryController({
  supabase,
  actorId,
  realmId,
  courseId = null,
}) {
  if (courseId) {
    const courseRow = await getCourseByIdDal({ supabase, courseId });

    if (!courseRow || courseRow.realm_id !== realmId) {
      return { ok: false, error: { code: "COURSE_NOT_FOUND" } };
    }

    const membershipRow = await getCourseMembershipByActorDal({
      supabase,
      courseId,
      actorId,
    });

    if (
      !membershipRow ||
      membershipRow.role !== "student" ||
      membershipRow.status === "removed"
    ) {
      return { ok: false, error: { code: "FORBIDDEN" } };
    }

    const summary = await buildCourseProgressSummary({
      supabase,
      actorId,
      courseRow,
      membershipRow,
    });

    return {
      ok: true,
      data: {
        scope: "course",
        course: summary.course,
        membership: summary.membership,
        totals: summary.totals,
      },
    };
  }

  const enrolledCourseRows = await listCoursesByActorIdDal({
    supabase,
    actorId,
    realmId,
  });

  const membershipRows = await Promise.all(
    enrolledCourseRows.map((courseRow) =>
      getCourseMembershipByActorDal({
        supabase,
        courseId: courseRow.id,
        actorId,
      }),
    ),
  );

  const studentEntries = enrolledCourseRows
    .map((courseRow, index) => ({
      courseRow,
      membershipRow: membershipRows[index],
    }))
    .filter(
      ({ membershipRow }) =>
        membershipRow &&
        membershipRow.role === "student" &&
        membershipRow.status !== "removed",
    );

  const courseSummaries = await Promise.all(
    studentEntries.map(({ courseRow, membershipRow }) =>
      buildCourseProgressSummary({
        supabase,
        actorId,
        courseRow,
        membershipRow,
      }),
    ),
  );

  return {
    ok: true,
    data: {
      scope: "all_courses",
      courses: courseSummaries,
      totals: aggregateCourseSummaries(courseSummaries),
    },
  };
}

export default getStudentProgressSummaryController;