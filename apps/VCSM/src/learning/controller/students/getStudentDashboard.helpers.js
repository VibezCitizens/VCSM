import { listLessonsByCourseIdDal } from "@/learning/dal/lessons/listLessonsByCourseId.dal";
import { listLessonProgressByCourseAndActorDal } from "@/learning/dal/lessonProgress/listLessonProgressByCourseAndActor.dal";
import { listAssignmentsByCourseIdDal } from "@/learning/dal/assignments/listAssignmentsByCourseId.dal";
import { getSubmissionAttemptDal } from "@/learning/dal/submissions/getSubmissionAttempt.dal";
import { getGradeBySubmissionIdDal } from "@/learning/dal/grades/getGradeBySubmissionId.dal";

export const STUDENT_ROLES = new Set(["student", "observer"]);

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

export async function buildPerCourseData({ supabase, studentCoursePairs, actorId }) {
  return Promise.all(
    studentCoursePairs.map(async ({ course, membership }) => {
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
          })
        )
      );

      const grades = await Promise.all(
        submissions.map((submission) => {
          if (!submission?.id) return Promise.resolve(null);
          return getGradeBySubmissionIdDal({
            supabase,
            submissionId: submission.id,
          });
        })
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
    })
  );
}
