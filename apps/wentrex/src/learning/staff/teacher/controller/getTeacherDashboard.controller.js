import { listCoursesByActorIdDal } from "@/learning/dal/courses/listCoursesByActorId.dal";
import { getCourseMembershipByActorDal } from "@/learning/dal/memberships/getCourseMembershipByActor.dal";
import { listAssignmentsByCourseIdDal } from "@/learning/dal/assignments/listAssignmentsByCourseId.dal";
import { listSubmissionsByAssignmentIdDal } from "@/learning/dal/submissions/listSubmissionsByAssignmentId.dal";
import { listGradesByAssignmentIdDal } from "@/learning/dal/grades/listGradesByAssignmentId.dal";

import { mapCourses } from "@/learning/model/course.model";
import { mapAssignments } from "@/learning/model/assignment.model";
import { mapMembership } from "@/learning/model/membership.model";

const TEACHER_ROLES = new Set(["instructor", "ta", "grader", "admin"]);

function isTeacherMembership(membership) {
  return Boolean(
    membership &&
      membership.status &&
      membership.status !== "removed" &&
      TEACHER_ROLES.has(membership.role)
  );
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export async function getTeacherDashboardController({
  supabase,
  actorId,
  realmId,
}) {
  if (!supabase) {
    throw new Error("getTeacherDashboardController requires supabase");
  }

  if (!actorId) {
    throw new Error("getTeacherDashboardController requires actorId");
  }

  if (!realmId) {
    return { ok: false, error: { code: "REALM_REQUIRED" } };
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
        recentAssignments: [],
        stats: {
          totalCourses: 0,
          totalAssignments: 0,
          totalSubmissions: 0,
          pendingSubmissions: 0,
          gradedSubmissions: 0,
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
      })
    )
  );

  const teacherCoursePairs = courseRows
    .map((course, index) => ({
      course,
      membership: membershipRows[index],
    }))
    .filter(({ membership }) => isTeacherMembership(membership));

  if (teacherCoursePairs.length === 0) {
    return {
      ok: false,
      error: { code: "FORBIDDEN" },
    };
  }

  const assignmentsByCourse = await Promise.all(
    teacherCoursePairs.map(({ course }) =>
      listAssignmentsByCourseIdDal({
        supabase,
        courseId: course.id,
        includeUnpublished: true,
      })
    )
  );

  const assignmentPairs = teacherCoursePairs.flatMap(({ course, membership }, index) =>
    (assignmentsByCourse[index] ?? []).map((assignment) => ({
      course,
      membership,
      assignment,
    }))
  );

  const submissionRowsByAssignment = await Promise.all(
    assignmentPairs.map(({ assignment }) =>
      listSubmissionsByAssignmentIdDal({
        supabase,
        assignmentId: assignment.id,
      })
    )
  );

  const gradeRowsByAssignment = await Promise.all(
    assignmentPairs.map(({ assignment }) =>
      listGradesByAssignmentIdDal({
        supabase,
        assignmentId: assignment.id,
      })
    )
  );

  let totalSubmissions = 0;
  let pendingSubmissions = 0;
  let gradedSubmissions = 0;
  let totalScore = 0;
  let totalScoredGrades = 0;

  const recentAssignments = assignmentPairs
    .map(({ course, assignment }, index) => {
      const submissions = submissionRowsByAssignment[index] ?? [];
      const grades = gradeRowsByAssignment[index] ?? [];

      const gradedSubmissionIds = new Set(
        grades.map((grade) => grade.submission_id).filter(Boolean)
      );

      const assignmentPendingCount = submissions.filter(
        (submission) =>
          submission.status === "submitted" &&
          !gradedSubmissionIds.has(submission.id)
      ).length;

      const assignmentGradedCount = grades.length;

      totalSubmissions += submissions.length;
      pendingSubmissions += assignmentPendingCount;
      gradedSubmissions += assignmentGradedCount;

      for (const grade of grades) {
        if (grade?.score !== null && grade?.score !== undefined) {
          totalScore += toNumber(grade.score);
          totalScoredGrades += 1;
        }
      }

      return {
        ...mapAssignments([assignment])[0],
        course: mapCourses([course])[0],
        submissionCount: submissions.length,
        pendingCount: assignmentPendingCount,
        gradedCount: assignmentGradedCount,
      };
    })
    .sort((a, b) => {
      const left = a.dueAt ? new Date(a.dueAt).getTime() : 0;
      const right = b.dueAt ? new Date(b.dueAt).getTime() : 0;
      return right - left;
    })
    .slice(0, 12);

  return {
    ok: true,
    data: {
      membership: mapMembership(teacherCoursePairs[0].membership),
      courses: teacherCoursePairs.map(({ course, membership }, index) => {
        const assignments = assignmentsByCourse[index] ?? [];
        const courseAssignmentIds = new Set(assignments.map((item) => item.id));

        const courseSubmissions = assignmentPairs.reduce((count, pair, pairIndex) => {
          if (!courseAssignmentIds.has(pair.assignment.id)) {
            return count;
          }
          return count + (submissionRowsByAssignment[pairIndex]?.length ?? 0);
        }, 0);

        const courseGrades = assignmentPairs.reduce((count, pair, pairIndex) => {
          if (!courseAssignmentIds.has(pair.assignment.id)) {
            return count;
          }
          return count + (gradeRowsByAssignment[pairIndex]?.length ?? 0);
        }, 0);

        const coursePending = assignmentPairs.reduce((count, pair, pairIndex) => {
          if (!courseAssignmentIds.has(pair.assignment.id)) {
            return count;
          }

          const submissions = submissionRowsByAssignment[pairIndex] ?? [];
          const grades = gradeRowsByAssignment[pairIndex] ?? [];
          const gradedSubmissionIds = new Set(
            grades.map((grade) => grade.submission_id).filter(Boolean)
          );

          return (
            count +
            submissions.filter(
              (submission) =>
                submission.status === "submitted" &&
                !gradedSubmissionIds.has(submission.id)
            ).length
          );
        }, 0);

        return {
          ...mapCourses([course])[0],
          membership: mapMembership(membership),
          assignmentCount: assignments.length,
          submissionCount: courseSubmissions,
          gradedCount: courseGrades,
          pendingCount: coursePending,
        };
      }),
      recentAssignments,
      stats: {
        totalCourses: teacherCoursePairs.length,
        totalAssignments: assignmentPairs.length,
        totalSubmissions,
        pendingSubmissions,
        gradedSubmissions,
        averageScore:
          totalScoredGrades > 0 ? totalScore / totalScoredGrades : null,
      },
    },
  };
}

export default getTeacherDashboardController;