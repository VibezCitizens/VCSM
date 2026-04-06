import { getCourseHomeController } from "@/learning/controller/shared/getCourseHome.controller";
import { listLessonsByCourseIdDal } from "@/learning/dal/lessons/listLessonsByCourseId.dal";

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
  const result = await getCourseHomeController({
    supabase,
    actorId,
    realmId,
    courseId,
  });

  if (!result?.ok) {
    return result;
  }

  const membership = result?.data?.membership ?? null;

  if (
    !membership ||
    membership.role !== "student" ||
    membership.status === "removed"
  ) {
    return { ok: false, error: { code: "FORBIDDEN" } };
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
}

export default getStudentCourseHomeController;