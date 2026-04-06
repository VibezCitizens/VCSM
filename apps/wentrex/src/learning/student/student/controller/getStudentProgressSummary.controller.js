import { getCourseByIdDal } from "@/learning/dal/courses/getCourseById.dal";
import { listCoursesByActorIdDal } from "@/learning/dal/courses/listCoursesByActorId.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";

import {
  createLearningError,
  withLearningErrorContext,
} from "@/learning/utils/realmDebug";

import {
  buildCourseProgressSummary,
  aggregateCourseSummaries,
} from "@/learning/student/controller/shared/buildCourseProgressSummary.controller";

export async function getStudentProgressSummaryController({
  supabase,
  actorId,
  realmId,
  courseId = null,
}) {
  try {
    if (courseId) {
      const courseRow = await getCourseByIdDal({ supabase, courseId });

      if (!courseRow || courseRow.realm_id !== realmId) {
        return {
          ok: false,
          error: createLearningError({
            code: "COURSE_NOT_FOUND",
            message: "Student course was not found in this learning realm",
            context: {
              layer: "controller",
              scope: "getStudentProgressSummaryController",
              actorId,
              realmId,
              courseId,
              resolvedRealmId: courseRow?.realm_id ?? null,
            },
            trace: [
              {
                scope: "getStudentProgressSummaryController",
                layer: "controller",
                actorId,
                realmId,
                courseId,
              },
            ],
          }),
        };
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
        return {
          ok: false,
          error: createLearningError({
            code: "FORBIDDEN",
            message: "This actor does not have active student access to the course",
            context: {
              layer: "controller",
              scope: "getStudentProgressSummaryController",
              actorId,
              realmId,
              courseId,
              membership: membershipRow
                ? {
                    role: membershipRow.role,
                    status: membershipRow.status,
                    courseId: membershipRow.course_id,
                  }
                : null,
            },
            trace: [
              {
                scope: "getStudentProgressSummaryController",
                layer: "controller",
                actorId,
                realmId,
                courseId,
              },
            ],
          }),
        };
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
  } catch (error) {
    return {
      ok: false,
      error: withLearningErrorContext(error, {
        scope: "getStudentProgressSummaryController",
        code: "STUDENT_PROGRESS_SUMMARY_FAILED",
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

export default getStudentProgressSummaryController;
