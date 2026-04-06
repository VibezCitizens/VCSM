import { getCourseHomeController } from "@/learning/controller/shared/getCourseHome.controller";
import { listLessonsByCourseIdDal } from "@/learning/dal/lessons/listLessonsByCourseId.dal";
import {
  createLearningError,
  withLearningErrorContext,
} from "@/learning/utils/realmDebug";

function buildStudentCourseHomeSummary({ lessons = [], progress = [], modules = [], assignments = [] }) {
  const totalLessons = lessons.length;
  const completedLessonCount = progress.filter(
    (item) => item?.state === "completed",
  ).length;
  const inProgressLessonCount = progress.filter(
    (item) => item?.state === "in_progress",
  ).length;
  const notStartedLessonCount = Math.max(
    totalLessons - completedLessonCount - inProgressLessonCount,
    0,
  );

  const progressPercent =
    totalLessons > 0
      ? Math.round((completedLessonCount / totalLessons) * 100)
      : 0;

  return {
    moduleCount: modules.length,
    lessonCount: totalLessons,
    assignmentCount: assignments.length,
    completedLessonCount,
    inProgressLessonCount,
    notStartedLessonCount,
    progressPercent,
  };
}

export async function getStudentCourseHomeController({
  supabase,
  actorId,
  realmId,
  courseId,
}) {
  try {
    const result = await getCourseHomeController({
      supabase,
      actorId,
      realmId,
      courseId,
    });

    if (!result?.ok) {
      return {
        ...result,
        error: withLearningErrorContext(result?.error, {
          scope: "getStudentCourseHomeController",
          code: result?.error?.code ?? "STUDENT_COURSE_HOME_FAILED",
          context: {
            layer: "controller",
            actorId,
            realmId,
            courseId,
            segment: "courseHome",
          },
        }),
      };
    }

    const membership = result?.data?.membership ?? null;

    if (
      !membership ||
      membership.role !== "student" ||
      membership.status === "removed"
    ) {
      return {
        ok: false,
        error: createLearningError({
          code: "FORBIDDEN",
          message: "This actor does not have active student access to the course",
          context: {
            layer: "controller",
            scope: "getStudentCourseHomeController",
            actorId,
            realmId,
            courseId,
            membership,
          },
          trace: [
            {
              scope: "getStudentCourseHomeController",
              layer: "controller",
              actorId,
              realmId,
              courseId,
            },
          ],
        }),
      };
    }

    const lessonRows = await listLessonsByCourseIdDal({
      supabase,
      courseId,
      includeUnpublished: false,
    });

    return {
      ok: true,
      data: {
        ...result.data,
        summary: buildStudentCourseHomeSummary({
          lessons: lessonRows,
          progress: result.data.progress ?? [],
          modules: result.data.modules ?? [],
          assignments: result.data.assignments ?? [],
        }),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: withLearningErrorContext(error, {
        scope: "getStudentCourseHomeController",
        code: "STUDENT_COURSE_HOME_FAILED",
        context: {
          layer: "controller",
          actorId,
          realmId,
          courseId,
        },
      }),
    };
  }
}

export default getStudentCourseHomeController;
