import { listCoursesByActorIdDal } from "@/learning/dal/courses/listCoursesByActorId.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listLessonsByCourseIdDal } from "@/learning/dal/lessons/listLessonsByCourseId.dal";
import { listAssignmentsByCourseIdDal } from "@/learning/dal/assignments/listAssignmentsByCourseId.dal";
import { listLessonProgressByCourseAndActorDal } from "@/learning/dal/lessonProgress/listLessonProgressByCourseAndActor.dal";

import { mapCourse } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";

function buildCourseSummary({ lessons = [], assignments = [], progress = [] }) {
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
    assignmentCount: assignments.length,
    completedLessons,
    inProgressLessons,
    notStartedLessons,
    progressPercent,
  };
}

export async function listStudentCoursesController({
  supabase,
  actorId,
  realmId,
}) {
  const courseRows = await listCoursesByActorIdDal({
    supabase,
    actorId,
    realmId,
  });

  const courseEntries = await Promise.all(
    courseRows.map(async (courseRow) => {
      const [membershipRow, lessonRows, assignmentRows, progressRows] =
        await Promise.all([
          getCourseMembershipByActorDal({
            supabase,
            courseId: courseRow.id,
            actorId,
          }),
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

      if (
        !membershipRow ||
        membershipRow.role !== "student" ||
        membershipRow.status === "removed"
      ) {
        return null;
      }

      return {
        course: mapCourse(courseRow),
        membership: mapMembership(membershipRow),
        summary: buildCourseSummary({
          lessons: lessonRows,
          assignments: assignmentRows,
          progress: progressRows,
        }),
      };
    }),
  );

  const courses = courseEntries.filter(Boolean);

  courses.sort((left, right) => {
    const leftDate = left?.course?.publishedAt ?? left?.course?.createdAt ?? "";
    const rightDate =
      right?.course?.publishedAt ?? right?.course?.createdAt ?? "";

    return String(rightDate).localeCompare(String(leftDate));
  });

  return {
    ok: true,
    data: {
      courses,
    },
  };
}

export default listStudentCoursesController;