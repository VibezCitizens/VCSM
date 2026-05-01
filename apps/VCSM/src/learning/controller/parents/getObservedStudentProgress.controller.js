import { getCourseByIdDal } from "@/learning/dal/courses/getCourseById.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listModulesByCourseIdDal } from "@/learning/dal/modules/listModulesByCourseId.dal";
import { listLessonsByCourseIdDal } from "@/learning/dal/lessons/listLessonsByCourseId.dal";
import { listLessonProgressByCourseAndActorDal } from "@/learning/dal/lessonProgress/listLessonProgressByCourseAndActor.dal";
import { getObserverStudentLinkDAL } from "@/learning/dal/observerStudentLinks/observerStudentLinks.dal";

import { mapCourse } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";
import { mapModules } from "@/learning/model/module.model";
import { mapLessons } from "@/learning/model/lesson.model";
import { mapLessonProgressList } from "@/learning/model/lessonProgress.model";

function isObserverRole(role) {
  return ["parent", "observer"].includes(role);
}

function buildSummary({ lessons = [], progress = [] }) {
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

function buildModuleProgress({ modules = [], lessons = [], progress = [] }) {
  const progressByLessonId = new Map(
    progress.map((item) => [item.lesson_id, item]),
  );

  return modules.map((moduleRow) => {
    const moduleLessons = lessons.filter(
      (lessonRow) => lessonRow.module_id === moduleRow.id,
    );

    const moduleCompletedLessons = moduleLessons.filter(
      (lessonRow) => progressByLessonId.get(lessonRow.id)?.state === "completed",
    ).length;

    const moduleInProgressLessons = moduleLessons.filter(
      (lessonRow) =>
        progressByLessonId.get(lessonRow.id)?.state === "in_progress",
    ).length;

    const moduleNotStartedLessons = Math.max(
      moduleLessons.length - moduleCompletedLessons - moduleInProgressLessons,
      0,
    );

    const progressPercent =
      moduleLessons.length > 0
        ? Math.round((moduleCompletedLessons / moduleLessons.length) * 100)
        : 0;

    return {
      id: moduleRow.id,
      title: moduleRow.title,
      description: moduleRow.description,
      sortOrder: moduleRow.sort_order,
      unlockAt: moduleRow.unlock_at,
      lessonCount: moduleLessons.length,
      completedLessons: moduleCompletedLessons,
      inProgressLessons: moduleInProgressLessons,
      notStartedLessons: moduleNotStartedLessons,
      progressPercent,
      lessons: moduleLessons.map((lessonRow) => ({
        id: lessonRow.id,
        moduleId: lessonRow.module_id,
        courseId: lessonRow.course_id,
        title: lessonRow.title,
        lessonType: lessonRow.lesson_type,
        sortOrder: lessonRow.sort_order,
        isPublished: lessonRow.is_published,
        progress: progressByLessonId.get(lessonRow.id)
          ? {
              id: progressByLessonId.get(lessonRow.id).id,
              lessonId: progressByLessonId.get(lessonRow.id).lesson_id,
              actorId: progressByLessonId.get(lessonRow.id).actor_id,
              state: progressByLessonId.get(lessonRow.id).state,
              completedAt: progressByLessonId.get(lessonRow.id).completed_at,
              updatedAt: progressByLessonId.get(lessonRow.id).updated_at,
            }
          : null,
      })),
    };
  });
}

export async function getObservedStudentProgressController({
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
    getObserverStudentLinkDAL({
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

  const [moduleRows, lessonRows, progressRows] = await Promise.all([
    listModulesByCourseIdDal({
      supabase,
      courseId,
      includeUnpublished: false,
    }),
    listLessonsByCourseIdDal({
      supabase,
      courseId,
      includeUnpublished: false,
    }),
    listLessonProgressByCourseAndActorDal({
      supabase,
      courseId,
      actorId: studentActorId,
    }),
  ]);

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
      summary: buildSummary({
        lessons: lessonRows,
        progress: progressRows,
      }),
      modules: mapModules(moduleRows),
      lessons: mapLessons(lessonRows),
      progress: mapLessonProgressList(progressRows),
      moduleProgress: buildModuleProgress({
        modules: moduleRows,
        lessons: lessonRows,
        progress: progressRows,
      }),
    },
  };
}

export default getObservedStudentProgressController;