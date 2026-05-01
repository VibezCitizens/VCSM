import { listCoursesByActorIdDal } from "@/learning/dal/courses/listCoursesByActorId.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listLessonsByCourseIdDal } from "@/learning/dal/lessons/listLessonsByCourseId.dal";
import { listLessonProgressByCourseAndActorDal } from "@/learning/dal/lessonProgress/listLessonProgressByCourseAndActor.dal";
import { listObservedStudentLinksDAL } from "@/learning/dal/observerStudentLinks/observerStudentLinks.dal";

import { mapCourse } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";

function isObserverRole(role) {
  return ["parent", "observer"].includes(role);
}

function isVisibleMembership(membershipRow) {
  return membershipRow && membershipRow.status !== "removed";
}

function buildProgressSummary({ lessons = [], progress = [] }) {
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

export async function listObservedStudentsController({
  supabase,
  actorId,
  realmId,
}) {
  const observerCourseRows = await listCoursesByActorIdDal({
    supabase,
    actorId,
    realmId,
  });

  const observerMembershipRows = await Promise.all(
    observerCourseRows.map((courseRow) =>
      getCourseMembershipByActorDal({
        supabase,
        courseId: courseRow.id,
        actorId,
      }),
    ),
  );

  const observerEntries = observerCourseRows
    .map((courseRow, index) => ({
      courseRow,
      observerMembershipRow: observerMembershipRows[index],
    }))
    .filter(
      ({ observerMembershipRow }) =>
        isVisibleMembership(observerMembershipRow) &&
        isObserverRole(observerMembershipRow.role),
    );

  if (observerEntries.length === 0) {
    return {
      ok: true,
      data: {
        observedStudents: [],
      },
    };
  }

  const courseIds = observerEntries.map(({ courseRow }) => courseRow.id);

  const linkRows = await listObservedStudentLinksDAL({
    supabase,
    observerActorId: actorId,
    courseIds,
  });

  const observedEntries = await Promise.all(
    linkRows.map(async (linkRow) => {
      const courseEntry = observerEntries.find(
        ({ courseRow }) => courseRow.id === linkRow.course_id,
      );

      if (!courseEntry) {
        return null;
      }

      const [studentMembershipRow, lessonRows, progressRows] = await Promise.all([
        getCourseMembershipByActorDal({
          supabase,
          courseId: linkRow.course_id,
          actorId: linkRow.student_actor_id,
        }),
        listLessonsByCourseIdDal({
          supabase,
          courseId: linkRow.course_id,
          includeUnpublished: false,
        }),
        listLessonProgressByCourseAndActorDal({
          supabase,
          courseId: linkRow.course_id,
          actorId: linkRow.student_actor_id,
        }),
      ]);

      if (
        !isVisibleMembership(studentMembershipRow) ||
        studentMembershipRow.role !== "student"
      ) {
        return null;
      }

      return {
        id: `${linkRow.course_id}:${linkRow.student_actor_id}`,
        studentActorId: linkRow.student_actor_id,
        observerActorId: linkRow.observer_actor_id,
        courseId: linkRow.course_id,
        linkedAt: linkRow.created_at ?? null,
        course: mapCourse(courseEntry.courseRow),
        observerMembership: mapMembership(courseEntry.observerMembershipRow),
        studentMembership: mapMembership(studentMembershipRow),
        progressSummary: buildProgressSummary({
          lessons: lessonRows,
          progress: progressRows,
        }),
      };
    }),
  );

  const observedStudents = observedEntries
    .filter(Boolean)
    .sort((left, right) => {
      const leftDate =
        left?.course?.publishedAt ?? left?.course?.createdAt ?? "";
      const rightDate =
        right?.course?.publishedAt ?? right?.course?.createdAt ?? "";

      return String(rightDate).localeCompare(String(leftDate));
    });

  return {
    ok: true,
    data: {
      observedStudents,
    },
  };
}

export default listObservedStudentsController;