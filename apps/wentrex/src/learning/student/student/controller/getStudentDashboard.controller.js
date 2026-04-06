import { listCoursesByActorIdDal } from "@/learning/dal/courses/listCoursesByActorId.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";

import { mapMembership } from "@/learning/model/membership.model";
import {
  createLearningError,
  withLearningErrorContext,
} from "@/learning/utils/realmDebug";

import {
  isStudentMembership,
  toNumber,
  fetchCourseBundle,
  buildCourseEntry,
} from "@/learning/student/controller/shared/buildStudentCourseData.controller";

export async function getStudentDashboardController({
  supabase,
  actorId,
  realmId = null,
}) {
  try {
    if (!supabase) {
      throw new Error("getStudentDashboardController requires supabase");
    }

    if (!actorId) {
      throw new Error("getStudentDashboardController requires actorId");
    }

    const courseRows = await listCoursesByActorIdDal({
      supabase,
      actorId,
      realmId,
    });

    if (!Array.isArray(courseRows) || courseRows.length === 0) {
      return {
        ok: true,
        data: {
          membership: null,
          courses: [],
          upcomingAssignments: [],
          recentGrades: [],
          continueLearning: [],
          stats: {
            totalCourses: 0,
            totalLessons: 0,
            completedLessons: 0,
            completionPercent: 0,
            totalAssignments: 0,
            submittedAssignments: 0,
            gradedAssignments: 0,
            averageScore: null,
          },
        },
      };
    }

    const membershipRows = await Promise.all(
      courseRows.map((course) =>
        getCourseMembershipByActorDal({
          supabase,
          courseId: course.id,
          actorId,
        }),
      ),
    );

    const studentCoursePairs = courseRows
      .map((course, index) => ({
        course,
        membership: membershipRows[index],
      }))
      .filter(({ membership }) => isStudentMembership(membership));

    if (studentCoursePairs.length === 0) {
      return {
        ok: false,
        error: createLearningError({
          code: "FORBIDDEN",
          message: "No active student memberships were found for this actor",
          context: {
            layer: "controller",
            scope: "getStudentDashboardController",
            actorId,
            realmId,
            courseCount: courseRows.length,
            membershipCount: membershipRows.filter(Boolean).length,
            membershipRoles: membershipRows.map((membership) =>
              membership
                ? {
                    courseId: membership.course_id,
                    role: membership.role,
                    status: membership.status,
                  }
                : null,
            ),
          },
          trace: [
            {
              scope: "getStudentDashboardController",
              layer: "controller",
              actorId,
              realmId,
            },
          ],
        }),
      };
    }

    const perCourseBundles = await Promise.all(
      studentCoursePairs.map(({ course, membership }) =>
        fetchCourseBundle({ supabase, course, membership, actorId }),
      ),
    );

    let totalLessons = 0;
    let completedLessons = 0;
    let totalAssignments = 0;
    let submittedAssignments = 0;
    let gradedAssignments = 0;
    let scoreSum = 0;
    let scoreCount = 0;

    const courses = [];
    const upcomingAssignments = [];
    const recentGrades = [];
    const continueLearning = [];

    for (const bundle of perCourseBundles) {
      const entry = buildCourseEntry(bundle);

      courses.push(entry.courseInfo);

      totalLessons += entry.stats.lessonCount;
      completedLessons += entry.stats.completedLessons;
      totalAssignments += entry.stats.assignmentCount;
      submittedAssignments += entry.stats.submittedCount;
      gradedAssignments += entry.stats.gradedCount;

      for (const score of entry.stats.scores) {
        scoreSum += score;
        scoreCount += 1;
      }

      upcomingAssignments.push(...entry.upcomingAssignments);
      recentGrades.push(...entry.recentGrades);

      if (entry.continueLearningEntry) {
        continueLearning.push(entry.continueLearningEntry);
      }
    }

    upcomingAssignments.sort((a, b) => {
      const left = a.dueAt
        ? new Date(a.dueAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const right = b.dueAt
        ? new Date(b.dueAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      return left - right;
    });

    recentGrades.sort((a, b) => {
      const left = a.grade?.gradedAt ? new Date(a.grade.gradedAt).getTime() : 0;
      const right = b.grade?.gradedAt ? new Date(b.grade.gradedAt).getTime() : 0;
      return right - left;
    });

    continueLearning.sort((a, b) =>
      a.course.title.localeCompare(b.course.title),
    );

    return {
      ok: true,
      data: {
        membership: mapMembership(studentCoursePairs[0].membership),
        courses,
        upcomingAssignments: upcomingAssignments.slice(0, 12),
        recentGrades: recentGrades.slice(0, 12),
        continueLearning: continueLearning.slice(0, 8),
        stats: {
          totalCourses: studentCoursePairs.length,
          totalLessons,
          completedLessons,
          completionPercent:
            totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0,
          totalAssignments,
          submittedAssignments,
          gradedAssignments,
          averageScore: scoreCount > 0 ? scoreSum / scoreCount : null,
        },
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: withLearningErrorContext(error, {
        scope: "getStudentDashboardController",
        code: "STUDENT_DASHBOARD_LOAD_FAILED",
        context: {
          layer: "controller",
          actorId,
          realmId,
        },
      }),
    };
  }
}

export default getStudentDashboardController;
