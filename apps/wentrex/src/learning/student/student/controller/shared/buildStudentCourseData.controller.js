import { listLessonsByCourseIdDal } from "@/learning/dal/lessons/listLessonsByCourseId.dal";
import { listLessonProgressByCourseAndActorDal } from "@/learning/dal/lessonProgress/listLessonProgressByCourseAndActor.dal";
import { listAssignmentsByCourseIdDal } from "@/learning/dal/assignments/listAssignmentsByCourseId.dal";
import { getSubmissionAttemptDal } from "@/learning/dal/submissions/getSubmissionAttempt.dal";
import { getGradeBySubmissionIdDal } from "@/learning/dal/grades/getGradeBySubmissionId.dal";

import { mapAssignments } from "@/learning/model/assignment.model";
import { mapSubmission } from "@/learning/model/submission.model";
import { mapGrade } from "@/learning/model/grade.model";
import { mapCourses } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";

const STUDENT_ROLES = new Set(["student", "observer"]);

export function isStudentMembership(membership) {
  return Boolean(
    membership &&
      membership.status &&
      membership.status !== "removed" &&
      STUDENT_ROLES.has(membership.role)
  );
}

export function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function getAssignmentStatus({ assignment, submission, grade }) {
  if (grade) return "graded";
  if (submission?.status === "submitted") return "submitted";
  if (submission?.status === "draft") return "draft";
  if (!assignment?.dueAt) return "upcoming";

  const dueTime = new Date(assignment.dueAt).getTime();
  if (Number.isFinite(dueTime) && dueTime < Date.now()) {
    return "missing";
  }

  return "upcoming";
}

export async function fetchCourseBundle({ supabase, course, membership, actorId }) {
  const [lessonRows, progressRows, assignmentRows] = await Promise.all([
    listLessonsByCourseIdDal({
      supabase,
      courseId: course.id,
      includeUnpublished: false,
    }),
    listLessonProgressByCourseAndActorDal({
      supabase,
      courseId: course.id,
      actorId,
    }),
    listAssignmentsByCourseIdDal({
      supabase,
      courseId: course.id,
      includeUnpublished: false,
    }),
  ]);

  const submissions = await Promise.all(
    assignmentRows.map((assignment) =>
      getSubmissionAttemptDal({
        supabase,
        assignmentId: assignment.id,
        actorId,
      }),
    ),
  );

  const grades = await Promise.all(
    submissions.map((submission) => {
      if (!submission?.id) return Promise.resolve(null);
      return getGradeBySubmissionIdDal({
        supabase,
        submissionId: submission.id,
      });
    }),
  );

  return {
    course,
    membership,
    lessons: lessonRows,
    progress: progressRows,
    assignments: assignmentRows,
    submissions,
    grades,
  };
}

export function buildCourseEntry(courseBundle) {
  const {
    course,
    membership,
    lessons,
    progress,
    assignments,
    submissions,
    grades,
  } = courseBundle;

  const completedForCourse = progress.filter(
    (row) => row.state === "completed" || Boolean(row.completed_at),
  ).length;
  const inProgressForCourse = progress.filter(
    (row) => row.state === "in_progress",
  ).length;
  const notStartedForCourse = Math.max(
    lessons.length - completedForCourse - inProgressForCourse,
    0,
  );

  const mappedAssignments = mapAssignments(assignments);

  const upcomingAssignments = [];
  const recentGrades = [];

  mappedAssignments.forEach((assignment, index) => {
    const submission = submissions[index] ?? null;
    const grade = grades[index] ?? null;
    const status = getAssignmentStatus({ assignment, submission, grade });

    upcomingAssignments.push({
      ...assignment,
      course: mapCourses([course])[0],
      submission: mapSubmission(submission),
      grade: mapGrade(grade),
      status,
    });

    if (grade) {
      recentGrades.push({
        ...assignment,
        course: mapCourses([course])[0],
        submission: mapSubmission(submission),
        grade: mapGrade(grade),
      });
    }
  });

  const lessonProgressByLessonId = new Map(
    progress.map((item) => [item.lesson_id, item]),
  );

  const nextLessonRow =
    lessons.find((lesson) => {
      const progressRow = lessonProgressByLessonId.get(lesson.id);
      return !progressRow || progressRow.state !== "completed";
    }) ?? lessons[0] ?? null;

  let continueLearningEntry = null;
  if (nextLessonRow) {
    continueLearningEntry = {
      course: mapCourses([course])[0],
      lesson: {
        id: nextLessonRow.id,
        moduleId: nextLessonRow.module_id,
        courseId: nextLessonRow.course_id,
        title: nextLessonRow.title,
        lessonType: nextLessonRow.lesson_type,
        body: nextLessonRow.body,
        externalUrl: nextLessonRow.external_url,
        fileUrl: nextLessonRow.file_url,
        sortOrder: nextLessonRow.sort_order,
        isPublished: nextLessonRow.is_published,
        createdByActorId: nextLessonRow.created_by_actor_id,
        createdAt: nextLessonRow.created_at,
        updatedAt: nextLessonRow.updated_at,
      },
      progress: nextLessonRow
        ? {
            completed: Boolean(
              lessonProgressByLessonId.get(nextLessonRow.id)?.completed_at ||
                lessonProgressByLessonId.get(nextLessonRow.id)?.state ===
                  "completed",
            ),
          }
        : null,
    };
  }

  return {
    courseInfo: {
      ...mapCourses([course])[0],
      membership: mapMembership(membership),
      lessonCount: lessons.length,
      completedLessons: completedForCourse,
      inProgressLessons: inProgressForCourse,
      notStartedLessons: notStartedForCourse,
      assignmentCount: assignments.length,
      progressPercent:
        lessons.length > 0
          ? Math.round((completedForCourse / lessons.length) * 100)
          : 0,
    },
    stats: {
      lessonCount: lessons.length,
      completedLessons: completedForCourse,
      assignmentCount: assignments.length,
      submittedCount: submissions.filter(
        (s) => s && s.status !== "draft",
      ).length,
      gradedCount: grades.filter(Boolean).length,
      scores: grades
        .filter(Boolean)
        .filter((g) => g.score !== null && g.score !== undefined)
        .map((g) => toNumber(g.score)),
    },
    upcomingAssignments,
    recentGrades,
    continueLearningEntry,
  };
}
