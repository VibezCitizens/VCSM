import { listCoursesByActorIdDal } from "@/learning/dal/courses/listCoursesByActorId.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listLessonsByCourseIdDal } from "@/learning/dal/lessons/listLessonsByCourseId.dal";
import { listLessonProgressByCourseAndActorDal } from "@/learning/dal/lessonProgress/listLessonProgressByCourseAndActor.dal";
import { listAssignmentsByCourseIdDal } from "@/learning/dal/assignments/listAssignmentsByCourseId.dal";
import { getSubmissionAttemptDal } from "@/learning/dal/submissions/getSubmissionAttempt.dal";
import { getGradeBySubmissionIdDal } from "@/learning/dal/grades/getGradeBySubmissionId.dal";

import { mapCourse } from "@/learning/model/course.model";
import { mapMembership } from "@/learning/model/membership.model";

import {
  isObserverRole,
  buildProgressSummary,
  buildAssignmentSummary,
  buildDashboardSummary,
} from "@/learning/parent/controller/shared/parentDashboardSummary.controller";
import { listObservedStudentLinks } from "@/learning/parent/controller/shared/listObservedStudentLinks.controller";

export async function getParentDashboardController({
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
        observerMembershipRow &&
        observerMembershipRow.status !== "removed" &&
        isObserverRole(observerMembershipRow.role),
    );

  if (observerEntries.length === 0) {
    return {
      ok: true,
      data: {
        summary: buildDashboardSummary([]),
        observedStudents: [],
      },
    };
  }

  const linkRows = await listObservedStudentLinks({
    supabase,
    observerActorId: actorId,
    courseIds: observerEntries.map(({ courseRow }) => courseRow.id),
  });

  const observedStudents = await Promise.all(
    linkRows.map(async (linkRow) => {
      const observerEntry = observerEntries.find(
        ({ courseRow }) => courseRow.id === linkRow.course_id,
      );

      if (!observerEntry) {
        return null;
      }

      const [studentMembershipRow, lessonRows, progressRows, assignmentRows] =
        await Promise.all([
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
          listAssignmentsByCourseIdDal({
            supabase,
            courseId: linkRow.course_id,
            includeUnpublished: false,
          }),
        ]);

      if (
        !studentMembershipRow ||
        studentMembershipRow.status === "removed" ||
        studentMembershipRow.role !== "student"
      ) {
        return null;
      }

      const assignmentStateRows = await Promise.all(
        assignmentRows.map(async (assignmentRow) => {
          const submissionRow = await getSubmissionAttemptDal({
            supabase,
            assignmentId: assignmentRow.id,
            actorId: linkRow.student_actor_id,
          });

          const gradeRow = submissionRow
            ? await getGradeBySubmissionIdDal({
                supabase,
                submissionId: submissionRow.id,
              })
            : null;

          const pointsPossible = Number(assignmentRow.points_possible ?? 0);
          const score = Number(gradeRow?.score ?? 0);

          const gradePercent =
            gradeRow && pointsPossible > 0
              ? Math.round((score / pointsPossible) * 10000) / 100
              : null;

          const dueAt = assignmentRow.due_at
            ? new Date(assignmentRow.due_at)
            : null;

          const overdue =
            !!dueAt &&
            Number.isFinite(dueAt.getTime()) &&
            dueAt.getTime() < Date.now() &&
            !submissionRow;

          return {
            graded: !!gradeRow,
            submitted: !!submissionRow,
            overdue,
            gradePercent,
          };
        }),
      );

      return {
        id: `${linkRow.course_id}:${linkRow.student_actor_id}`,
        courseId: linkRow.course_id,
        studentActorId: linkRow.student_actor_id,
        observerActorId: linkRow.observer_actor_id,
        linkedAt: linkRow.created_at ?? null,
        course: mapCourse(observerEntry.courseRow),
        observerMembership: mapMembership(observerEntry.observerMembershipRow),
        studentMembership: mapMembership(studentMembershipRow),
        progressSummary: buildProgressSummary({
          lessons: lessonRows,
          progress: progressRows,
        }),
        assignmentSummary: buildAssignmentSummary(assignmentStateRows),
      };
    }),
  );

  const items = observedStudents
    .filter(Boolean)
    .sort((left, right) => {
      const leftCourseDate =
        left?.course?.publishedAt ?? left?.course?.createdAt ?? "";
      const rightCourseDate =
        right?.course?.publishedAt ?? right?.course?.createdAt ?? "";

      return String(rightCourseDate).localeCompare(String(leftCourseDate));
    });

  return {
    ok: true,
    data: {
      summary: buildDashboardSummary(items),
      observedStudents: items,
    },
  };
}

export default getParentDashboardController;
