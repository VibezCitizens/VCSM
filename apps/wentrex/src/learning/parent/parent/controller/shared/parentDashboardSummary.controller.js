export function isObserverRole(role) {
  return ["parent", "observer"].includes(role);
}

export function buildProgressSummary({ lessons = [], progress = [] }) {
  const totalLessons = lessons.length;
  const completedLessons = progress.filter(
    (item) => item?.state === "completed",
  ).length;
  const inProgressLessons = progress.filter(
    (item) => item?.state === "in_progress",
  ).length;
  const notStartedLessons = Math.max(
    totalLessons - completedLessons - inProgressLessons,
    0,
  );

  const progressPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return {
    lessonCount: totalLessons,
    completedLessons,
    inProgressLessons,
    notStartedLessons,
    progressPercent,
  };
}

export function buildAssignmentSummary(items = []) {
  const summary = {
    totalAssignments: items.length,
    gradedAssignments: 0,
    submittedAssignments: 0,
    overdueAssignments: 0,
    averageGradePercent: null,
  };

  const gradePercents = [];

  for (const item of items) {
    if (item.graded) summary.gradedAssignments += 1;
    if (item.submitted) summary.submittedAssignments += 1;
    if (item.overdue) summary.overdueAssignments += 1;
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

export function buildDashboardSummary(observedStudents = []) {
  const summary = {
    observedStudentCount: observedStudents.length,
    courseCount: 0,
    totalLessons: 0,
    completedLessons: 0,
    inProgressLessons: 0,
    notStartedLessons: 0,
    progressPercent: 0,
    totalAssignments: 0,
    gradedAssignments: 0,
    submittedAssignments: 0,
    overdueAssignments: 0,
    averageGradePercent: null,
  };

  const courseIds = new Set();
  const gradePercents = [];

  for (const item of observedStudents) {
    courseIds.add(item.courseId);

    summary.totalLessons += item.progressSummary.lessonCount;
    summary.completedLessons += item.progressSummary.completedLessons;
    summary.inProgressLessons += item.progressSummary.inProgressLessons;
    summary.notStartedLessons += item.progressSummary.notStartedLessons;

    summary.totalAssignments += item.assignmentSummary.totalAssignments;
    summary.gradedAssignments += item.assignmentSummary.gradedAssignments;
    summary.submittedAssignments += item.assignmentSummary.submittedAssignments;
    summary.overdueAssignments += item.assignmentSummary.overdueAssignments;

    if (Number.isFinite(item.assignmentSummary.averageGradePercent)) {
      gradePercents.push(item.assignmentSummary.averageGradePercent);
    }
  }

  summary.courseCount = courseIds.size;
  summary.progressPercent =
    summary.totalLessons > 0
      ? Math.round((summary.completedLessons / summary.totalLessons) * 100)
      : 0;

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
